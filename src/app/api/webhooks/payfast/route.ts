import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";
import { computeCommission } from "@/lib/payments/commission";
import { confirmWithPayfast, getPassphrase, parseOrderedForm, toRecord, verifyItnSignature } from "@/lib/payments/payfastSignature";

type PayfastCustomData = {
  purchase_id?: string;
  track_id?: string;
  musician_id?: string;
  fan_name?: string;
  fan_email?: string;
  type?: string;
};

// Ported from base44/functions/payfastNotify/entry.ts. Scoped to the
// track-purchase branch only — the original also handled a merchandise
// branch, but Merchandise/MerchandiseOrder don't exist in this rebuild yet
// (Stage 5). That branch is a TODO below, not silently dropped.
//
// Every response is 200 even on rejection (invalid signature, unconfirmed,
// etc.) — matches the original: a non-200 tells Payfast to keep retrying
// something we have already permanently rejected, which just adds noise.
export async function POST(req: NextRequest) {
  // Defense-in-depth only, not the real gate: a genuine Payfast ITN never
  // carries a Clerk session. The actual authentication is the signature
  // check below, which runs regardless of this.
  const authHeader = req.headers.get("authorization");
  if (authHeader) {
    const user = await getCurrentAppUser();
    if (!user || user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const rawBody = await req.text();
  const pairs = parseOrderedForm(rawBody);
  const payfastData = toRecord(pairs);

  let passphrase: string;
  try {
    passphrase = getPassphrase();
  } catch (err) {
    console.error("[payfast webhook] config error:", err);
    return new NextResponse("Configuration error", { status: 500 });
  }

  if (!verifyItnSignature(pairs, passphrase)) {
    console.error("[payfast webhook] signature verification failed — rejecting");
    return new NextResponse("Invalid signature", { status: 200 });
  }

  if (!(await confirmWithPayfast(rawBody))) {
    console.error("[payfast webhook] Payfast did not confirm this notification");
    return new NextResponse("not confirmed", { status: 200 });
  }

  let customData: PayfastCustomData = {};
  try {
    customData = JSON.parse(payfastData.custom_str1 || "{}");
  } catch (err) {
    console.error("[payfast webhook] failed to parse custom_str1:", err);
  }

  const paymentStatus = payfastData.payment_status;
  const amount = parseFloat(payfastData.amount_gross || "0");

  if (customData.type === "merchandise") {
    // TODO(Stage 5 — Merchandise): port the merchandise-order branch from
    // the original once MerchandiseOrder exists. Until then, acknowledge
    // so Payfast doesn't retry, but do nothing — there is no order to
    // update.
    console.warn("[payfast webhook] merchandise order notification received, but Stage 5 isn't built yet:", customData);
    return new NextResponse("OK", { status: 200 });
  }

  if (paymentStatus === "COMPLETE") {
    await withServiceRole(async (tx) => {
      let purchase = customData.purchase_id ? await tx.purchase.findUnique({ where: { id: customData.purchase_id } }) : null;

      if (!purchase && customData.track_id && customData.musician_id && customData.fan_email) {
        purchase = await tx.purchase.findFirst({
          where: {
            trackId: customData.track_id,
            musicianId: customData.musician_id,
            fanEmail: customData.fan_email,
            status: "PENDING",
          },
        });
      }

      if (!purchase) {
        console.warn("[payfast webhook] no matching purchase found for:", customData);
        return;
      }

      // Idempotency: Payfast can and does send duplicate ITNs.
      if (purchase.status === "COMPLETED") return;

      const { musicianEarnings, platformFee } = await computeCommission(tx, purchase.musicianId, amount);

      await tx.purchase.update({
        where: { id: purchase.id },
        data: {
          status: "COMPLETED",
          amountPaid: amount,
          musicianEarnings,
          platformFee,
          paymentReference: payfastData.pf_payment_id || purchase.paymentReference,
        },
      });

      const track = await tx.track.findUnique({ where: { id: purchase.trackId } });
      if (track) {
        await tx.track.update({
          where: { id: track.id },
          data: {
            downloadsCount: track.downloadsCount + 1,
            revenueGenerated: Number(track.revenueGenerated) + musicianEarnings,
          },
        });
      }

      const musician = await tx.musician.findUnique({ where: { id: purchase.musicianId } });
      if (musician) {
        await tx.musician.update({
          where: { id: musician.id },
          data: { totalRevenue: Number(musician.totalRevenue) + musicianEarnings },
        });
      }

      if (purchase.fanEmail) {
        const fan = await tx.fan.findUnique({ where: { email: purchase.fanEmail } });
        if (fan) {
          await tx.fan.update({
            where: { id: fan.id },
            data: { totalSpent: Number(fan.totalSpent) + amount, purchasesCount: fan.purchasesCount + 1 },
          });
        } else {
          await tx.fan.create({
            data: { fullName: purchase.fanName ?? undefined, email: purchase.fanEmail, totalSpent: amount, purchasesCount: 1 },
          });
        }
      }

      // TODO(email provider): the original sent a "your download is
      // ready" email with the track link here. No transactional email
      // provider is wired up yet — see the approveMusician commit for the
      // same gap. Revisit once one is chosen.
      console.log("[payfast webhook] payment processed for purchase:", purchase.id);
    });
  } else if (paymentStatus === "FAILED" || paymentStatus === "CANCELLED") {
    await withServiceRole(async (tx) => {
      if (customData.purchase_id) {
        await tx.purchase.update({ where: { id: customData.purchase_id }, data: { status: "FAILED" } }).catch(() => {});
        return;
      }
      if (customData.track_id && customData.musician_id && customData.fan_email) {
        const purchase = await tx.purchase.findFirst({
          where: {
            trackId: customData.track_id,
            musicianId: customData.musician_id,
            fanEmail: customData.fan_email,
            status: "PENDING",
          },
        });
        if (purchase) {
          await tx.purchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
        }
      }
    });
  }

  return new NextResponse("OK", { status: 200 });
}
