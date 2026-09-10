import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";
import { getCurrentAppUser } from "@/lib/auth";
import { computeCommission } from "@/lib/payments/commission";

const sellSchema = z.object({
  merchandiseId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  size: z.string().trim().max(20).optional(),
  fanName: z.string().trim().min(1).max(200),
  fanEmail: z.email(),
});

// A musician manually recording a walk-up, paid-in-person sale — not a
// fan-facing checkout. merchandiseorder_write RLS requires
// app.is_admin() (see its own comment: "created server-side from a
// verified payment webhook"), so this runs under withServiceRole once
// ownership of the item is confirmed under the caller's own context —
// same shape as every other money-writing route in this app. Recorded
// as DELIVERED immediately: cash/card changed hands and the item left
// with the fan at the point of sale, there's no shipping step to track.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = sellSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { merchandiseId, quantity, size, fanName, fanEmail } = parsed.data;

  const result = await withServiceRole(async (tx) => {
    const item = await tx.merchandise.findUnique({ where: { id: merchandiseId } });
    if (!item) return { status: 404 as const, error: "Item not found" };

    const musician = await tx.musician.findFirst({ where: { id: item.musicianId, OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 403 as const, error: "Forbidden" };

    const unitPrice = Number(item.priceZar ?? 0);
    const totalAmount = unitPrice * quantity;

    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (!fan) fan = await tx.fan.create({ data: { fullName: fanName, email: fanEmail } });

    const order = await tx.merchandiseOrder.create({
      data: { merchandiseId, fanId: fan.id, musicianId: item.musicianId, quantity, size, totalAmount, fanName, fanEmail, status: "DELIVERED" },
    });

    const { musicianEarnings } = await computeCommission(tx, item.musicianId, totalAmount);
    await tx.merchandise.update({ where: { id: item.id }, data: { unitsSold: { increment: quantity }, revenueGenerated: { increment: musicianEarnings } } });
    await tx.musician.update({ where: { id: item.musicianId }, data: { totalRevenue: { increment: musicianEarnings } } });
    await tx.fan.update({ where: { id: fan.id }, data: { totalSpent: { increment: totalAmount }, purchasesCount: { increment: 1 } } });

    return { status: 200 as const, order };
  });

  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.order.id });
}
