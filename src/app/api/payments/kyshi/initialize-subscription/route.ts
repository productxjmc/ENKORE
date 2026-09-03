import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";
import { installmentAmount, resolveSubscriptionGateway } from "@/lib/payments/subscriptionPricing";
import { prepareSubscriptionInstallment } from "@/lib/payments/subscriptionInstallment";
import { isKyshiTestMode, kyshiApiKey, kyshiBaseUrl } from "@/lib/payments/kyshiSignature";

const VALID_TIERS = ["Soundcheck", "Mainstage", "Headliner"] as const;

// Ported from base44/functions/initializeKyshiSubscription/entry.ts —
// see subscriptionInstallment.ts's comment for the shared "prepare one
// installment" logic this and the Payfast route both call. Same trust
// boundary/service-role reasoning as that route's comment.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const musicianId = typeof body?.musicianId === "string" ? body.musicianId : "";
  const requestedTier = VALID_TIERS.includes(body?.tier) ? body.tier : null;
  if (!musicianId) return NextResponse.json({ error: "musicianId is required" }, { status: 400 });

  const apiKey = kyshiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Kyshi is not configured in this environment yet" }, { status: 503 });
  }

  type Result =
    | { status: 404 | 400 | 403; error: string }
    | { status: 409; error: string }
    | { status: 200; reference: string; amount: number; currency: string; email: string; tierName: string; subscriptionId: string; paymentId: string };

  const result = await withServiceRole<Result>(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404, error: "Musician not found" };
    if (musician.userId !== user.id && musician.email !== user.email && user.role !== "ADMIN") {
      return { status: 403, error: "Forbidden" };
    }

    const { currency, usesKyshi } = resolveSubscriptionGateway(musician.country);
    if (!usesKyshi) return { status: 400, error: "Kyshi payments are only available for Nigeria, Kenya, or Ghana-based artists." };

    const tierName = requestedTier ?? (VALID_TIERS.includes(musician.selectedPlan as (typeof VALID_TIERS)[number]) ? (musician.selectedPlan as (typeof VALID_TIERS)[number]) : "Soundcheck");
    const feePlan = await tx.feePlan.findFirst({ where: { name: tierName } });
    if (!feePlan) return { status: 400, error: `FeePlan "${tierName}" not found — run scripts/seed-fee-plans.mjs first` };

    const amount = installmentAmount(feePlan, currency);

    const prepared = await prepareSubscriptionInstallment(tx, musician.id, musician.email, tierName, amount, currency, "KYSHI");
    if (prepared.status === 409) return { status: 409, error: prepared.error };

    return { status: 200, reference: prepared.reference, amount, currency, email: musician.email, tierName, subscriptionId: prepared.subscriptionId, paymentId: prepared.paymentId };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const origin = new URL(req.url).origin;

  const kyshiRes = await fetch(`${kyshiBaseUrl()}/transactions/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
    body: JSON.stringify({
      amount: result.amount,
      email: result.email,
      localCurrency: result.currency,
      reference: result.reference,
      channels: ["card", "mobileMoney", "bankTransfer"],
      redirectUrl: `${origin}/payment-confirmation?reference=${result.reference}`,
      meta: {
        type: "subscription",
        subscription_record_id: result.subscriptionId,
        payment_record_id: result.paymentId,
        tier: result.tierName,
        localCurrency: result.currency,
        localAmount: result.amount,
      },
    }),
  });

  const rawText = await kyshiRes.text();
  let kyshiData: { data?: { authorizationUrl?: string; authorization_url?: string; reference?: string; accessCode?: string } };
  try {
    kyshiData = JSON.parse(rawText);
  } catch {
    console.error("[kyshi subscription initialize] non-JSON response:", rawText.slice(0, 300));
    return NextResponse.json({ error: "Kyshi returned an invalid response" }, { status: 502 });
  }

  if (!kyshiRes.ok) {
    console.error("[kyshi subscription initialize] init failed:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "Kyshi payment initialization failed", details: kyshiData }, { status: 400 });
  }

  const authorizationUrl = kyshiData.data?.authorizationUrl || kyshiData.data?.authorization_url;
  if (!authorizationUrl) {
    console.error("[kyshi subscription initialize] no authorization URL in response:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "No authorization URL returned by Kyshi" }, { status: 502 });
  }

  // The SubscriptionPayment row was created (with paymentReference =
  // result.reference) before this call, inside the same withServiceRole
  // block that computed amount/tier — Kyshi can reassign its own
  // reference in the response, so the stored row must be kept in sync or
  // the webhook (which matches by paymentReference) would never find it.
  const txRef = kyshiData.data?.reference || result.reference;
  if (txRef !== result.reference) {
    await withServiceRole((tx) => tx.subscriptionPayment.update({ where: { id: result.paymentId }, data: { paymentReference: txRef } }));
  }

  return NextResponse.json({
    success: true,
    authorizationUrl,
    reference: txRef,
    currency: result.currency,
    testMode: isKyshiTestMode(),
  });
}
