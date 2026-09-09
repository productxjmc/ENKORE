import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { computeCommission } from "@/lib/payments/commission";
import { isKyshiTestMode, kyshiApiKey, kyshiBaseUrl } from "@/lib/payments/kyshiSignature";
import { kyshiInitializeSchema } from "@/lib/validation/kyshiInitialize";

// Ported from base44/functions/initializeKyshiPayment/entry.ts, with two
// deliberate fixes rather than a faithful port of what was there:
//
// 1. The original required an authenticated user (base44.auth.me()).
//    Nothing about Kyshi specifically needs that — the storefront's
//    guest-checkout UX (fans aren't logged in) is exactly what
//    initializePayment's Payfast path was already built for. Requiring
//    login only for Nigerian fans, and not for South African ones, isn't
//    a documented product decision anywhere; it reads as inherited from
//    initializePaymentGateway (not ported, see the Payfast commit) rather
//    than an intentional choice. Anonymous here, matching Payfast.
//
// 2. The original checked only `amount < 1` — no floor against the
//    track's real minimumPrice at all. This is the third occurrence of
//    the same missing-price-validation bug (Yoco, initializePaymentGateway,
//    now Kyshi's own dedicated route) — every gateway's init route needs
//    the check initializePayment's Payfast path already had.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = kyshiInitializeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { trackId, musicianId, fanEmail, fanName, amount, localCurrency, channel } = parsed.data;

  const apiKey = kyshiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Kyshi is not configured in this environment yet" }, { status: 503 });
  }

  const validation = await withServiceRole(async (tx) => {
    const track = await tx.track.findUnique({ where: { id: trackId } });
    if (!track) return { status: 404 as const, error: "Track not found" };

    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };

    // Kyshi is restricted to Nigeria-based musicians — unchanged from the
    // original.
    if (musician.country !== "NIGERIA") {
      return { status: 403 as const, error: "Kyshi payments are only available for Nigeria-based artists." };
    }

    const minAmount = Number(track.minimumPrice ?? 0);
    if (amount < minAmount) {
      return { status: 400 as const, error: `Amount must be at least ${minAmount.toFixed(2)}` };
    }

    return { status: 200 as const };
  });

  if (validation.status !== 200) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const currency = localCurrency ?? "NGN";
  const reference = `ENKORE-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const origin = new URL(req.url).origin;

  const kyshiRes = await fetch(`${kyshiBaseUrl()}/transactions/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      amount,
      email: fanEmail,
      localCurrency: currency,
      reference,
      // A caller-selected channel narrows the array to that one value
      // (confirmed via Kyshi's own docs that `["card"]` alone works) —
      // omitted, it falls back to all three exactly as before, so the
      // existing web storefront checkout (which never sends `channel`)
      // is unaffected by this change.
      channels: channel ? [channel] : ["card", "mobileMoney", "bankTransfer"],
      redirectUrl: `${origin}/payment-confirmation?reference=${reference}`,
    }),
  });

  const rawText = await kyshiRes.text();
  let kyshiData: { data?: { authorizationUrl?: string; authorization_url?: string; reference?: string; accessCode?: string } };
  try {
    kyshiData = JSON.parse(rawText);
  } catch {
    console.error("[kyshi initialize] non-JSON response:", rawText.slice(0, 300));
    return NextResponse.json({ error: "Kyshi returned an invalid response" }, { status: 502 });
  }

  if (!kyshiRes.ok) {
    console.error("[kyshi initialize] init failed:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "Kyshi payment initialization failed", details: kyshiData }, { status: 400 });
  }

  const authorizationUrl = kyshiData.data?.authorizationUrl || kyshiData.data?.authorization_url;
  const txRef = kyshiData.data?.reference || reference;
  if (!authorizationUrl) {
    console.error("[kyshi initialize] no authorization URL in response:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "No authorization URL returned by Kyshi" }, { status: 502 });
  }

  // Only create the pending Purchase once Kyshi has actually accepted the
  // transaction — an init call that fails partway (bad response, no auth
  // URL) shouldn't leave a dangling PENDING row, same reasoning as the
  // Payfast route's credential check moving before its transaction.
  await withServiceRole(async (tx) => {
    const { musicianEarnings, platformFee } = await computeCommission(tx, musicianId, amount);
    await tx.purchase.create({
      data: {
        trackId,
        musicianId,
        amountPaid: amount,
        currency,
        platformFee,
        musicianEarnings,
        paymentMethod: "KYSHI",
        status: "PENDING",
        paymentReference: txRef,
        fanEmail,
        fanName,
      },
    });
  });

  return NextResponse.json({
    success: true,
    authorizationUrl,
    reference: txRef,
    accessCode: kyshiData.data?.accessCode,
    currency,
    testMode: isKyshiTestMode(),
  });
}
