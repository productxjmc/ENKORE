import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";
import { computeCommission } from "@/lib/payments/commission";
import { completeSubscriptionInstallment } from "@/lib/payments/subscriptionCompletion";
import { completeFanSubscription } from "@/lib/payments/fanSubscriptionCompletion";
import { completeTicketPurchase } from "@/lib/payments/ticketCompletion";
import { isWithinReplayWindow, verifyKyshiSignature } from "@/lib/payments/kyshiSignature";

type KyshiEventData = {
  reference?: string;
  amount?: number;
  meta?: {
    localCurrency?: string;
    localAmount?: number;
    order_id?: string;
    type?: string;
    payment_record_id?: string;
    musicianId?: string;
    fanEmail?: string;
    fanName?: string;
    amount?: number;
    currency?: string;
  };
};

// Ported from base44/functions/kyshiWebhook/entry.ts. Handles track
// purchases and subscription-installment completion (see
// completeSubscriptionInstallment). The original also handled
// merchandise-order fulfillment and the full subscription renewal
// lifecycle (reminders, past-due, cancellations) — Merchandise/
// MerchandiseOrder don't exist in this rebuild yet (Stage 5), and there's
// no billing-sweep cron to drive renewal lifecycle events, so those stay
// TODOs below rather than ported code with nothing to act on. What's
// kept: the signature verification, replay-window check, and
// flat-vs-wrapped payload handling were already hardened in the original
// (see its own comments) — ported close to verbatim rather than redone.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const user = await getCurrentAppUser();
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-kyshi-signature");
  const webhookSecret = process.env.KYSHI_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    console.error("[kyshi webhook] missing signature or webhook secret");
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  if (!verifyKyshiSignature(rawBody, signature, webhookSecret)) {
    console.error("[kyshi webhook] invalid signature");
    // 4xx is not retried by Kyshi, which is what we want for a reject.
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (!isWithinReplayWindow(req.headers.get("x-kyshi-timestamp"))) {
    console.error("[kyshi webhook] stale webhook rejected");
    return NextResponse.json({ error: "Stale webhook" }, { status: 403 });
  }

  let payload: { event?: string; data?: KyshiEventData } & KyshiEventData;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    console.error("[kyshi webhook] malformed JSON payload");
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  // Kyshi's documented charge payload is flat — { reference, amount, meta,
  // event } with no `data` wrapper — but accept a wrapped shape too rather
  // than assume, matching the original's already-fixed handling here.
  const data: KyshiEventData = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const event = payload.event;
  console.log(`[kyshi webhook] event=${event}, ref=${data?.reference}`);

  if (event === "successful" || event === "charge.success") {
    const reference = data.reference;
    const confirmedAmount = data.meta?.localAmount ?? data.amount ?? 0;
    const localCurrency = data.meta?.localCurrency;

    // TODO(Stage 5 — Merchandise): the original fulfilled a merchandise
    // order here when data.meta.order_id matched a pending
    // MerchandiseOrder. MerchandiseOrder doesn't exist yet.
    if (data.meta?.order_id) {
      console.warn("[kyshi webhook] merchandise order notification received, but Stage 5 isn't built yet:", data.meta.order_id);
      return NextResponse.json({ received: true });
    }

    if (data.meta?.type === "subscription" && data.meta?.payment_record_id) {
      if (!reference) {
        console.warn("[kyshi webhook] subscription notification missing reference:", data.meta.payment_record_id);
        return NextResponse.json({ received: true });
      }
      await withServiceRole(async (tx) => {
        const result = await completeSubscriptionInstallment(tx, reference);
        if (!result.ok) console.warn("[kyshi webhook] subscription completion failed:", result.reason);
        else console.log("[kyshi webhook] subscription installment paid, ref:", reference);
      });
      return NextResponse.json({ received: true });
    }

    if (data.meta?.type === "fan_subscription") {
      if (!reference || !data.meta?.musicianId || !data.meta?.fanEmail) {
        console.warn("[kyshi webhook] fan_subscription notification missing required fields:", data.meta);
        return NextResponse.json({ received: true });
      }
      await withServiceRole(async (tx) => {
        const result = await completeFanSubscription(tx, {
          reference,
          musicianId: data.meta!.musicianId!,
          fanEmail: data.meta!.fanEmail!,
          fanName: data.meta!.fanName,
          amount: data.meta?.amount ?? confirmedAmount,
          currency: data.meta?.currency ?? "NGN",
        });
        if (!result.ok) console.warn("[kyshi webhook] fan_subscription completion failed:", result.reason);
        else console.log("[kyshi webhook] fan subscription created, ref:", reference);
      });
      return NextResponse.json({ received: true });
    }

    if (data.meta?.type === "ticket") {
      if (!reference) {
        console.warn("[kyshi webhook] ticket notification missing reference");
        return NextResponse.json({ received: true });
      }
      await withServiceRole(async (tx) => {
        const result = await completeTicketPurchase(tx, reference, { confirmedAmount });
        if (!result.ok) console.warn("[kyshi webhook] ticket completion failed:", result.reason);
        else console.log("[kyshi webhook] ticket purchase confirmed, ref:", reference);
      });
      return NextResponse.json({ received: true });
    }

    if (!reference) {
      return NextResponse.json({ received: true });
    }

    await withServiceRole(async (tx) => {
      const purchase = await tx.purchase.findFirst({ where: { paymentReference: reference } });
      if (!purchase) {
        console.warn(`[kyshi webhook] no purchase found for ref=${reference}`);
        return;
      }

      // Idempotency: Kyshi may deliver the same event more than once.
      if (purchase.status === "COMPLETED") return;

      // Defense-in-depth: Kyshi is restricted to Nigeria-based musicians.
      const musician = await tx.musician.findUnique({ where: { id: purchase.musicianId } });
      if (!musician || musician.country !== "NIGERIA") {
        console.warn(`[kyshi webhook] rejected transaction for non-Nigerian artist: ${purchase.musicianId}`);
        return;
      }

      const { musicianEarnings, platformFee } = await computeCommission(tx, purchase.musicianId, confirmedAmount);

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: "COMPLETED",
          amountPaid: confirmedAmount,
          currency: (localCurrency as "NGN" | "KES" | "GHS" | "XOF" | undefined) ?? purchase.currency,
          musicianEarnings,
          platformFee,
        },
      });

      const track = await tx.track.findUnique({ where: { id: purchase.trackId } });
      if (track) {
        await tx.track.update({
          where: { id: track.id },
          data: { downloadsCount: track.downloadsCount + 1, revenueGenerated: Number(track.revenueGenerated) + confirmedAmount },
        });
      }

      await tx.musician.update({
        where: { id: musician.id },
        data: { totalRevenue: Number(musician.totalRevenue) + musicianEarnings },
      });

      if (purchase.fanEmail) {
        const fan = await tx.fan.findUnique({ where: { email: purchase.fanEmail } });
        if (fan) {
          await tx.fan.update({
            where: { id: fan.id },
            data: { totalSpent: Number(fan.totalSpent) + confirmedAmount, purchasesCount: fan.purchasesCount + 1 },
          });
        } else {
          await tx.fan.create({
            data: { fullName: purchase.fanName ?? undefined, email: purchase.fanEmail, totalSpent: confirmedAmount, purchasesCount: 1 },
          });
        }
      }

      // TODO(email provider): same gap noted on approveMusician and the
      // Payfast webhook — no transactional email provider wired up yet.
      console.log("[kyshi webhook] payment processed for purchase:", purchase.id);
    });
  } else if (event === "failed" || event === "charge.failed" || event === "cancelled") {
    const reference = data.reference;
    if (reference) {
      await withServiceRole(async (tx) => {
        const purchase = await tx.purchase.findFirst({ where: { paymentReference: reference } });
        if (purchase && purchase.status !== "FAILED") {
          await tx.purchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
          return;
        }
        await tx.subscriptionPayment.updateMany({ where: { paymentReference: reference, status: "PENDING" }, data: { status: "FAILED" } });
        await tx.ticketPurchase.updateMany({ where: { ticketCode: reference, status: "PENDING" }, data: { status: "CANCELLED" } });
      });
    }
  } else {
    // TODO: invoice.payment_succeeded / invoice.payment_failed /
    // subscription.past_due / subscription.cancelled / not_renewing —
    // renewal-reminder and lapse-sweep lifecycle events, not the one-off
    // "installment paid" completion handled above (that part is done).
    // None apply yet — there's no billing-sweep cron in this rebuild to
    // emit or react to them.
    console.log(`[kyshi webhook] unhandled event type: ${event}`);
  }

  return NextResponse.json({ received: true });
}
