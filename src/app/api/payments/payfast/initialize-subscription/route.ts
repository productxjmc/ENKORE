import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";
import { installmentAmountZar } from "@/lib/payments/subscriptionPricing";
import { prepareSubscriptionInstallment } from "@/lib/payments/subscriptionInstallment";
import { isTestMode } from "@/lib/payments/payfastSignature";

const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";
const VALID_TIERS = ["Soundcheck", "Mainstage", "Headliner"] as const;

// Ported from base44/functions/initializeKyshiSubscription/entry.ts's
// design (see subscriptionInstallment.ts's comment for why, not the
// stale initializePayfastSubscription/entry.ts) — a one-time payment for
// one installment, same as this app's existing track-purchase Payfast
// route, not a recurring Payfast subscription. Payfast is ZAR-only,
// matching the source's own comment.
//
// The caller is an AUTHENTICATED musician paying ENKORE, not an
// anonymous fan — different trust boundary from the fan-checkout
// initialize routes, so this stays its own route rather than folding
// into a shared dispatcher. withServiceRole for the actual DB writes:
// MusicianSubscription/SubscriptionPayment inserts require
// app.is_admin() per prisma/rls.sql, even for the musician's own money —
// getCurrentAppUser() + the manual ownership check below are what
// actually gate who can call this, not RLS.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const musicianId = typeof body?.musicianId === "string" ? body.musicianId : "";
  const requestedTier = VALID_TIERS.includes(body?.tier) ? body.tier : null;
  if (!musicianId) return NextResponse.json({ error: "musicianId is required" }, { status: 400 });

  const testMode = isTestMode();
  const merchantId = testMode ? process.env.PAYFAST_MERCHANT_ID_TEST : process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = testMode ? process.env.PAYFAST_MERCHANT_KEY_TEST : process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    return NextResponse.json({ error: "Payfast is not configured in this environment yet" }, { status: 503 });
  }

  type Result =
    | { status: 404 | 400 | 403; error: string }
    | { status: 409; error: string }
    | { status: 200; reference: string; amount: number; musicianName: string; email: string; tierName: string };

  const result = await withServiceRole<Result>(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404, error: "Musician not found" };
    if (musician.userId !== user.id && musician.email !== user.email && user.role !== "ADMIN") {
      return { status: 403, error: "Forbidden" };
    }

    const tierName = requestedTier ?? (VALID_TIERS.includes(musician.selectedPlan as (typeof VALID_TIERS)[number]) ? (musician.selectedPlan as (typeof VALID_TIERS)[number]) : "Soundcheck");
    const feePlan = await tx.feePlan.findFirst({ where: { name: tierName } });
    if (!feePlan) return { status: 400, error: `FeePlan "${tierName}" not found — run scripts/seed-fee-plans.mjs first` };

    const amount = installmentAmountZar(feePlan);

    const prepared = await prepareSubscriptionInstallment(tx, musician.id, musician.email, tierName, amount, "ZAR", "PAYFAST");
    if (prepared.status === 409) return { status: 409, error: prepared.error };

    return { status: 200, reference: prepared.reference, amount, musicianName: musician.musicianName, email: musician.email, tierName };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const origin = new URL(req.url).origin;

  return NextResponse.json({
    success: true,
    paymentUrl: testMode ? SANDBOX_PROCESS_URL : LIVE_PROCESS_URL,
    paymentData: {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/payment-confirmation?reference=${result.reference}`,
      cancel_url: `${origin}/payment-cancel`,
      notify_url: `${origin}/api/webhooks/payfast`,
      amount: result.amount.toFixed(2),
      item_name: `ENKORE ${result.tierName} Subscription`.slice(0, 100),
      item_description: `${result.tierName} subscription installment for ${result.musicianName}`.slice(0, 255),
      m_payment_id: result.reference,
      email_address: result.email,
      custom_str1: JSON.stringify({ type: "subscription", paymentReference: result.reference }),
    },
  });
}
