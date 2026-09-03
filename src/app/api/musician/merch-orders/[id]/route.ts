import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type OrderStatus = (typeof VALID_STATUSES)[number];

// merchandiseorder_modify RLS covers owner update (insert is admin-only,
// but this route only ever updates an existing order's status).
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status: OrderStatus = body?.status;
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const data: { status: OrderStatus; trackingNumber?: string } = { status };
  if (typeof body?.trackingNumber === "string") data.trackingNumber = body.trackingNumber.trim();

  const result = await withCurrentUser((tx) => tx.merchandiseOrder.updateMany({ where: { id }, data }));
  if (result.count === 0) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
