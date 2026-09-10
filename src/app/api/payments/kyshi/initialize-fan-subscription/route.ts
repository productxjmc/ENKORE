import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";
import { isKyshiTestMode, kyshiApiKey, kyshiBaseUrl } from "@/lib/payments/kyshiSignature";
import { KYSHI_CHANNELS } from "@/lib/validation/kyshiInitialize";
import { FAN_SUBSCRIPTION_MIN_ZAR } from "@/lib/payments/fanSubscriptionPricing";
import { convertFromZar } from "@/lib/pricingConfig";

const bodySchema = z.object({
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  amount: z.number().positive(),
  channel: z.enum(KYSHI_CHANNELS).optional(),
});

// Mirrors initialize-fan-subscription (Payfast)'s comment for why no DB
// row is created here. Kyshi is restricted to Nigeria-based musicians,
// same convention as every other Kyshi route in this app.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, fanEmail, fanName, amount, channel } = parsed.data;

  const apiKey = kyshiApiKey();
  if (!apiKey) return NextResponse.json({ error: "Kyshi is not configured in this environment yet" }, { status: 503 });

  const minAmount = convertFromZar(FAN_SUBSCRIPTION_MIN_ZAR, "NGN");
  if (amount < minAmount) {
    return NextResponse.json({ error: `Amount must be at least ₦${minAmount.toFixed(0)}` }, { status: 400 });
  }

  const musician = await withServiceRole((tx) => tx.musician.findUnique({ where: { id: musicianId } }));
  if (!musician) return NextResponse.json({ error: "Musician not found" }, { status: 404 });
  if (musician.country !== "NIGERIA") {
    return NextResponse.json({ error: "Kyshi payments are only available for Nigeria-based artists." }, { status: 403 });
  }

  const reference = `ENKORE-FANSUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const origin = new URL(req.url).origin;

  const kyshiRes = await fetch(`${kyshiBaseUrl()}/transactions/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
    body: JSON.stringify({
      amount,
      email: fanEmail,
      localCurrency: "NGN",
      reference,
      channels: channel ? [channel] : ["card", "mobileMoney", "bankTransfer"],
      redirectUrl: `${origin}/payment-confirmation?reference=${reference}`,
      meta: { type: "fan_subscription", musicianId, fanEmail, fanName, amount, currency: "NGN" },
    }),
  });

  const rawText = await kyshiRes.text();
  let kyshiData: { data?: { authorizationUrl?: string; authorization_url?: string; reference?: string } };
  try {
    kyshiData = JSON.parse(rawText);
  } catch {
    console.error("[kyshi fan-subscription initialize] non-JSON response:", rawText.slice(0, 300));
    return NextResponse.json({ error: "Kyshi returned an invalid response" }, { status: 502 });
  }

  if (!kyshiRes.ok) {
    console.error("[kyshi fan-subscription initialize] init failed:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "Kyshi payment initialization failed", details: kyshiData }, { status: 400 });
  }

  const authorizationUrl = kyshiData.data?.authorizationUrl || kyshiData.data?.authorization_url;
  if (!authorizationUrl) {
    console.error("[kyshi fan-subscription initialize] no authorization URL in response:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "No authorization URL returned by Kyshi" }, { status: 502 });
  }

  return NextResponse.json({
    success: true,
    authorizationUrl,
    reference: kyshiData.data?.reference || reference,
    currency: "NGN",
    testMode: isKyshiTestMode(),
  });
}
