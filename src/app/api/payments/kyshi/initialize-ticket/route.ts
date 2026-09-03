import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { isKyshiTestMode, kyshiApiKey, kyshiBaseUrl } from "@/lib/payments/kyshiSignature";
import { ticketInitializeSchema } from "@/lib/validation/ticketInitialize";

// See initialize-ticket (Payfast)'s comment for why this exists instead
// of porting TicketPurchaseModal.jsx's Yoco integration. Mirrors the
// existing track-purchase Kyshi route: Kyshi is restricted to Nigeria-
// based musicians (unchanged convention from that route).
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = ticketInitializeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  }
  const { eventId, musicianId, fanEmail, fanName, quantity } = parsed.data;

  const apiKey = kyshiApiKey();
  if (!apiKey) {
    return NextResponse.json({ error: "Kyshi is not configured in this environment yet" }, { status: 503 });
  }

  const validation = await withServiceRole(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return { status: 404 as const, error: "Event not found" };
    if (event.musicianId !== musicianId) return { status: 400 as const, error: "Event does not belong to this musician" };
    if (event.status === "CANCELLED") return { status: 409 as const, error: "This event has been cancelled" };

    const remaining = event.totalTickets - event.ticketsSold;
    if (quantity > remaining) return { status: 409 as const, error: `Only ${remaining} ticket${remaining === 1 ? "" : "s"} remaining` };

    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };
    if (musician.country !== "NIGERIA") return { status: 403 as const, error: "Kyshi payments are only available for Nigeria-based artists." };

    return { status: 200 as const, amount: Number(event.ticketPrice) * quantity };
  });

  if (validation.status !== 200) {
    return NextResponse.json({ error: validation.error }, { status: validation.status });
  }

  const amount = validation.amount;
  const reference = `ENKORE-TIX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const origin = new URL(req.url).origin;

  const kyshiRes = await fetch(`${kyshiBaseUrl()}/transactions/initialize`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}` },
    body: JSON.stringify({
      amount,
      email: fanEmail,
      localCurrency: "NGN",
      reference,
      channels: ["card", "mobileMoney", "bankTransfer"],
      redirectUrl: `${origin}/payment-confirmation?reference=${reference}`,
      meta: { type: "ticket" },
    }),
  });

  const rawText = await kyshiRes.text();
  let kyshiData: { data?: { authorizationUrl?: string; authorization_url?: string; reference?: string; accessCode?: string } };
  try {
    kyshiData = JSON.parse(rawText);
  } catch {
    console.error("[kyshi ticket initialize] non-JSON response:", rawText.slice(0, 300));
    return NextResponse.json({ error: "Kyshi returned an invalid response" }, { status: 502 });
  }

  if (!kyshiRes.ok) {
    console.error("[kyshi ticket initialize] init failed:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "Kyshi payment initialization failed", details: kyshiData }, { status: 400 });
  }

  const authorizationUrl = kyshiData.data?.authorizationUrl || kyshiData.data?.authorization_url;
  const txRef = kyshiData.data?.reference || reference;
  if (!authorizationUrl) {
    console.error("[kyshi ticket initialize] no authorization URL in response:", JSON.stringify(kyshiData));
    return NextResponse.json({ error: "No authorization URL returned by Kyshi" }, { status: 502 });
  }

  // Only create the pending TicketPurchase once Kyshi has actually
  // accepted the transaction, same reasoning as the track-purchase route.
  await withServiceRole(async (tx) => {
    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (!fan) fan = await tx.fan.create({ data: { fullName: fanName || undefined, email: fanEmail } });

    await tx.ticketPurchase.create({
      data: { eventId, fanId: fan.id, musicianId, quantity, totalAmount: amount, fanName, fanEmail, status: "PENDING", ticketCode: txRef },
    });
  });

  return NextResponse.json({ success: true, authorizationUrl, reference: txRef, currency: "NGN", testMode: isKyshiTestMode() });
}
