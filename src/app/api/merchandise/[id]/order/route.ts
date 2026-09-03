import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { toPlain } from "@/lib/serialize";
import { sendNewMerchOrderEmail } from "@/lib/email/merchOrder";

const CURRENCY_FIELD: Record<string, "priceZar" | "priceNgn" | "priceUsd"> = { ZAR: "priceZar", NGN: "priceNgn", USD: "priceUsd" };

// Ported from base44/functions/createMerchOrder/entry.ts — the "no online
// payment" request flow MerchOrderModal.jsx actually uses (confirmed by
// reading it directly): a fan requests an item, the musician arranges
// payment/fulfillment directly afterward. This is NOT a Payfast/Kyshi
// checkout — merchandiseorder_write RLS requires app.is_admin() to insert
// (even for an anonymous fan, since there's no owning session at all
// here), so this runs under withServiceRole with the price read from the
// catalogue, never trusted from the request body — the exact vulnerability
// the source's own comment says this function replaced (client-writable
// total_amount).
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: merchandiseId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const quantity = Math.max(1, Math.min(50, Number.parseInt(String(body?.quantity ?? 1), 10) || 1));
  const size = typeof body?.size === "string" ? body.size.slice(0, 20) : "";
  const fanName = typeof body?.fanName === "string" ? body.fanName.trim().slice(0, 120) : "";
  const fanEmail = typeof body?.fanEmail === "string" ? body.fanEmail.trim().toLowerCase() : "";
  const currency = CURRENCY_FIELD[body?.currency] ? body.currency : "ZAR";
  const shippingAddress = body?.shippingAddress && typeof body.shippingAddress === "object" ? body.shippingAddress : {};

  if (!fanEmail) return NextResponse.json({ error: "fanEmail is required." }, { status: 400 });

  type Result =
    | { status: 404 | 409; error: string }
    | { status: 200; orderId: string; totalAmount: number; currency: string; itemName: string; musicianEmail: string; size: string; quantity: number; fanName: string; fanEmail: string };

  const result = await withServiceRole<Result>(async (tx) => {
    const item = await tx.merchandise.findUnique({ where: { id: merchandiseId } });
    if (!item || item.status !== "ACTIVE") return { status: 404, error: "This item is not available." };

    const priceField = CURRENCY_FIELD[currency];
    const unitPrice = Number(item[priceField] ?? item.priceZar ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) return { status: 409, error: `No ${currency} price configured for this item.` };

    if (!item.isOnDemand && item.stockQuantity < quantity) return { status: 409, error: "Not enough stock available." };

    const musician = await tx.musician.findUnique({ where: { id: item.musicianId } });
    if (!musician) return { status: 404, error: "Musician not found." };

    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (!fan) fan = await tx.fan.create({ data: { fullName: fanName || undefined, email: fanEmail } });

    const totalAmount = unitPrice * quantity;
    const order = await tx.merchandiseOrder.create({
      data: {
        merchandiseId,
        fanId: fan.id,
        musicianId: item.musicianId,
        quantity,
        size,
        totalAmount,
        fanName,
        fanEmail,
        shippingAddress,
        status: "PENDING",
      },
    });

    return { status: 200, orderId: order.id, totalAmount, currency, itemName: item.name, musicianEmail: musician.email, size, quantity, fanName, fanEmail };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await sendNewMerchOrderEmail(result.musicianEmail, {
    itemName: result.itemName,
    size: result.size,
    quantity: result.quantity,
    currency: result.currency,
    total: result.totalAmount,
    fanName: result.fanName,
    fanEmail: result.fanEmail,
  });

  return NextResponse.json(toPlain({ success: true, orderId: result.orderId, totalAmount: result.totalAmount, currency: result.currency }));
}
