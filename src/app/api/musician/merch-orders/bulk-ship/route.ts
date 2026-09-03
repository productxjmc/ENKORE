import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Ported from MerchOrdersDashboard.jsx's bulkMarkShipped — Base44's
// bulkUpdate() becomes a single scoped updateMany. merchandiseorder_modify
// RLS already restricts this to the caller's own orders — no need to
// verify each id belongs to this musician separately, a mismatched id in
// the list is just silently excluded from the count.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string") : [];
  if (ids.length === 0) return NextResponse.json({ error: "No order ids provided" }, { status: 400 });

  const result = await withCurrentUser((tx) => tx.merchandiseOrder.updateMany({ where: { id: { in: ids }, status: { in: ["PENDING", "PROCESSING"] } }, data: { status: "SHIPPED" } }));

  return NextResponse.json({ ok: true, updated: result.count });
}
