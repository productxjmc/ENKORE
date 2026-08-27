import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { computeCommission } from "@/lib/payments/commission";
import { kyshiApiKey, kyshiBaseUrl } from "@/lib/payments/kyshiSignature";

// Ported from base44/functions/verifyKyshiTransaction/entry.ts — called by
// the payment-confirmation page when a guest fan returns from Kyshi's
// hosted checkout, as an immediate-confirmation path alongside the webhook
// (which is authoritative but can lag). Same auth fix as the initialize
// route: the original required a logged-in user, which a guest fan
// checking their own payment status never has.
//
// Also more thorough than the original here: it only updated Purchase and
// Musician, not Track or Fan. But the webhook's idempotency check skips
// its ENTIRE update once status is already COMPLETED — so if this route
// fires first (fan returns before the webhook arrives, which is the
// common case) and only does a partial update, the webhook later finds
// nothing left to do and Track/Fan stats never get backfilled at all.
// Whichever of the two completes first has to do the full job.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const reference = (body as { reference?: unknown })?.reference;
  if (typeof reference !== "string" || !reference) {
    return NextResponse.json({ error: "Transaction reference is required" }, { status: 400 });
  }

  const apiKey = kyshiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Kyshi is not configured in this environment yet" }, { status: 503 });
  }

  const kyshiRes = await fetch(`${kyshiBaseUrl()}/transactions/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: { Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
  });

  const rawText = await kyshiRes.text();
  let kyshiData: { data?: { status?: string; amount?: number; localCurrency?: string; email?: string } };
  try {
    kyshiData = JSON.parse(rawText);
  } catch {
    console.error("[kyshi verify] non-JSON response:", rawText.slice(0, 300));
    return NextResponse.json({ error: "Kyshi returned an invalid response" }, { status: 502 });
  }

  if (!kyshiRes.ok) {
    return NextResponse.json({ error: "Transaction verification failed", details: kyshiData }, { status: 400 });
  }

  const txStatus = kyshiData.data?.status;

  if (txStatus === "successful") {
    await withServiceRole(async (tx) => {
      const purchase = await tx.purchase.findFirst({ where: { paymentReference: reference } });
      if (!purchase) {
        console.warn(`[kyshi verify] no purchase found for ref=${reference}`);
        return;
      }
      // Idempotency: the webhook may already have completed this.
      if (purchase.status === "COMPLETED") return;

      const amount = kyshiData.data?.amount ?? Number(purchase.amountPaid);
      const { musicianEarnings, platformFee } = await computeCommission(tx, purchase.musicianId, amount);

      await tx.purchase.update({
        where: { id: purchase.id },
        data: { status: "COMPLETED", amountPaid: amount, musicianEarnings, platformFee },
      });

      const track = await tx.track.findUnique({ where: { id: purchase.trackId } });
      if (track) {
        await tx.track.update({
          where: { id: track.id },
          data: { downloadsCount: track.downloadsCount + 1, revenueGenerated: Number(track.revenueGenerated) + musicianEarnings },
        });
      }

      const musician = await tx.musician.findUnique({ where: { id: purchase.musicianId } });
      if (musician) {
        await tx.musician.update({ where: { id: musician.id }, data: { totalRevenue: Number(musician.totalRevenue) + musicianEarnings } });
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
    });
  }

  return NextResponse.json({ status: txStatus, data: kyshiData.data });
}
