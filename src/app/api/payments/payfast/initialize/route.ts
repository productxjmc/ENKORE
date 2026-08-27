import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { computeCommission } from "@/lib/payments/commission";
import { isTestMode } from "@/lib/payments/payfastSignature";
import { payfastInitializeSchema } from "@/lib/validation/payfastInitialize";

const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";

// Ported from base44/functions/initializePayment/entry.ts — the anonymous,
// guest-checkout track-purchase flow (fans aren't required to have an
// account). No auth required, matching the storefront's actual UX.
//
// This is deliberately the ONLY Payfast init path ported — the old
// codebase also had initializePaymentGateway, a newer multi-provider
// dispatcher found while reading the payment code, which trusts the
// client-supplied `amount` for every provider including Payfast with no
// floor check at all (the same bug class as the Yoco gap from the
// original code review, just undocumented until now). Not porting that
// path is the fix.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = payfastInitializeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { trackId, musicianId, fanEmail, fanName, amount } = parsed.data;

  // Checked before anything touches the database — unlike the original
  // (which created the Purchase row first, then discovered credentials
  // were missing), this avoids leaving dangling PENDING rows in any
  // environment where Payfast isn't configured yet, which is every
  // environment right now.
  const testMode = isTestMode();
  const merchantId = testMode ? process.env.PAYFAST_MERCHANT_ID_TEST : process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = testMode ? process.env.PAYFAST_MERCHANT_KEY_TEST : process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    return NextResponse.json({ error: "Payfast is not configured in this environment yet" }, { status: 503 });
  }

  const result = await withServiceRole(async (tx) => {
    const track = await tx.track.findUnique({ where: { id: trackId } });
    if (!track) return { status: 404 as const, error: "Track not found" };

    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };

    // The load-bearing check this whole route exists for: never trust the
    // client-supplied amount past this floor. Every other gateway's
    // initialize route needs the identical check before this ships.
    const minAmount = Number(track.minimumPrice ?? 0);
    if (amount < minAmount) {
      return { status: 400 as const, error: `Amount must be at least R${minAmount.toFixed(2)}` };
    }

    const paymentReference = `ENKORE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { musicianEarnings, platformFee } = await computeCommission(tx, musicianId, amount);

    const purchase = await tx.purchase.create({
      data: {
        trackId,
        musicianId,
        amountPaid: amount,
        platformFee,
        musicianEarnings,
        paymentMethod: "PAYFAST",
        status: "PENDING",
        paymentReference,
        fanEmail,
        fanName,
        currency: "ZAR",
      },
      select: { id: true },
    });

    return {
      status: 200 as const,
      purchaseId: purchase.id,
      paymentReference,
      itemName: track.title.slice(0, 100),
      itemDescription: `Digital download by ${musician.musicianName}`.slice(0, 255),
    };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const origin = new URL(req.url).origin;

  return NextResponse.json({
    success: true,
    purchaseId: result.purchaseId,
    paymentUrl: testMode ? SANDBOX_PROCESS_URL : LIVE_PROCESS_URL,
    paymentData: {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/payment-success?purchase_id=${result.purchaseId}`,
      cancel_url: `${origin}/payment-cancel`,
      notify_url: `${origin}/api/webhooks/payfast`,
      amount: amount.toFixed(2),
      item_name: result.itemName,
      item_description: result.itemDescription,
      m_payment_id: result.paymentReference,
      custom_str1: JSON.stringify({
        purchase_id: result.purchaseId,
        track_id: trackId,
        musician_id: musicianId,
        fan_name: fanName,
        fan_email: fanEmail,
        type: "track_purchase",
      }),
    },
  });
}
