import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";
import { isTestMode } from "@/lib/payments/payfastSignature";
import { FAN_SUBSCRIPTION_MIN_ZAR } from "@/lib/payments/fanSubscriptionPricing";
import { convertFromZar } from "@/lib/pricingConfig";

const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";

const bodySchema = z.object({
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  amount: z.number().positive(),
});

// A FAN paying a MUSICIAN monthly — distinct trust boundary from
// initialize-subscription (a musician paying ENKORE for their own tier).
// Same anonymous-checkout shape as the track/ticket-purchase routes: no
// FanSubscription row is created here (prisma/rls.sql: "created
// server-side once the first payment clears") — this route only talks to
// Payfast and encodes what the webhook needs into custom_str1.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, fanEmail, fanName, amount } = parsed.data;

  const testMode = isTestMode();
  const merchantId = testMode ? process.env.PAYFAST_MERCHANT_ID_TEST : process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = testMode ? process.env.PAYFAST_MERCHANT_KEY_TEST : process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    return NextResponse.json({ error: "Payfast is not configured in this environment yet" }, { status: 503 });
  }

  const minAmount = convertFromZar(FAN_SUBSCRIPTION_MIN_ZAR, "ZAR");
  if (amount < minAmount) {
    return NextResponse.json({ error: `Amount must be at least R${minAmount.toFixed(2)}` }, { status: 400 });
  }

  const musician = await withServiceRole((tx) => tx.musician.findUnique({ where: { id: musicianId } }));
  if (!musician) return NextResponse.json({ error: "Musician not found" }, { status: 404 });

  const reference = `ENKORE-FANSUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const origin = new URL(req.url).origin;

  return NextResponse.json({
    success: true,
    paymentUrl: testMode ? SANDBOX_PROCESS_URL : LIVE_PROCESS_URL,
    paymentData: {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: `${origin}/payment-success?purchase_id=${reference}`,
      cancel_url: `${origin}/payment-cancel`,
      notify_url: `${origin}/api/webhooks/payfast`,
      amount: amount.toFixed(2),
      item_name: `Monthly support for ${musician.musicianName}`.slice(0, 100),
      item_description: `Monthly support subscription for ${musician.musicianName}`.slice(0, 255),
      m_payment_id: reference,
      email_address: fanEmail,
      custom_str1: JSON.stringify({
        type: "fan_subscription",
        paymentReference: reference,
        musician_id: musicianId,
        fan_email: fanEmail,
        fan_name: fanName,
        amount,
        currency: "ZAR",
      }),
    },
  });
}
