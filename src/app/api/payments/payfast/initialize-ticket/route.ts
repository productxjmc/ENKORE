import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { isTestMode } from "@/lib/payments/payfastSignature";
import { ticketInitializeSchema } from "@/lib/validation/ticketInitialize";

const LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process";
const SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process";

// Ported from the Base44 app's src/pages/EventsManagement.jsx +
// components/events/TicketPurchaseModal.jsx — WITHOUT the source's Yoco
// integration. Yoco appears nowhere else in this rebuild (only Payfast/
// Kyshi are actually wired up), and the source's own "Pay ... with Yoco
// (Test)" button label suggests it never left prototype status even in
// Base44. Built on the same proven one-time-payment pattern as track
// purchases instead — same trust boundary (anonymous fan checkout), kept
// as a separate route rather than extending the existing initialize
// route with a discriminator, to avoid any risk to that already-shipped,
// verified flow for marginal benefit.
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

  const testMode = isTestMode();
  const merchantId = testMode ? process.env.PAYFAST_MERCHANT_ID_TEST : process.env.PAYFAST_MERCHANT_ID;
  const merchantKey = testMode ? process.env.PAYFAST_MERCHANT_KEY_TEST : process.env.PAYFAST_MERCHANT_KEY;
  if (!merchantId || !merchantKey) {
    return NextResponse.json({ error: "Payfast is not configured in this environment yet" }, { status: 503 });
  }

  const result = await withServiceRole(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return { status: 404 as const, error: "Event not found" };
    if (event.musicianId !== musicianId) return { status: 400 as const, error: "Event does not belong to this musician" };
    if (event.status === "CANCELLED") return { status: 409 as const, error: "This event has been cancelled" };

    const remaining = event.totalTickets - event.ticketsSold;
    if (quantity > remaining) return { status: 409 as const, error: `Only ${remaining} ticket${remaining === 1 ? "" : "s"} remaining` };

    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };

    const amount = Number(event.ticketPrice) * quantity;
    const paymentReference = `ENKORE-TIX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (!fan) fan = await tx.fan.create({ data: { fullName: fanName || undefined, email: fanEmail } });

    const ticketPurchase = await tx.ticketPurchase.create({
      data: { eventId, fanId: fan.id, musicianId, quantity, totalAmount: amount, fanName, fanEmail, status: "PENDING", ticketCode: paymentReference },
      select: { id: true },
    });

    return {
      status: 200 as const,
      ticketPurchaseId: ticketPurchase.id,
      paymentReference,
      amount,
      itemName: event.title.slice(0, 100),
      itemDescription: `${quantity} ticket(s) for ${musician.musicianName}`.slice(0, 255),
      fanEmail,
    };
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
      return_url: `${origin}/payment-success?purchase_id=${result.ticketPurchaseId}`,
      cancel_url: `${origin}/payment-cancel`,
      notify_url: `${origin}/api/webhooks/payfast`,
      amount: result.amount.toFixed(2),
      item_name: result.itemName,
      item_description: result.itemDescription,
      m_payment_id: result.paymentReference,
      email_address: result.fanEmail,
      custom_str1: JSON.stringify({ type: "ticket", paymentReference: result.paymentReference }),
    },
  });
}
