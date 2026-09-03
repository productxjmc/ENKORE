import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import MerchOrdersDashboard, { type PlainMerchOrder } from "@/components/dashboard/MerchOrdersDashboard";

// Ported from the Base44 app's src/pages/MerchOrdersDashboard.jsx. The
// source's live realtime subscription (MerchandiseOrder.subscribe()) has
// no equivalent here — no realtime infra exists in this rebuild, and the
// plan's locked decision was polling/refetch instead. This page is
// server-rendered on load; the client dashboard refetches via
// router.refresh() after any status change rather than truly living.
export default async function MerchOrdersPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [orders, merchandise] = await Promise.all([
      tx.merchandiseOrder.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 200 }),
      tx.merchandise.findMany({ where: { musicianId: musician.id } }),
    ]);

    return { orders, merchandise };
  });

  if (!data) redirect("/musician-pre-register");

  const merchMap = Object.fromEntries(data.merchandise.map((m) => [m.id, { name: m.name, imageUrl: m.imageUrl }]));
  const orders: PlainMerchOrder[] = data.orders.map((o) => ({
    id: o.id,
    merchandiseId: o.merchandiseId,
    itemName: merchMap[o.merchandiseId]?.name ?? "Merchandise item",
    itemImageUrl: merchMap[o.merchandiseId]?.imageUrl ?? null,
    quantity: o.quantity,
    size: o.size,
    totalAmount: Number(o.totalAmount),
    fanName: o.fanName,
    fanEmail: o.fanEmail,
    shippingAddress: (o.shippingAddress as Record<string, string> | null) ?? {},
    status: o.status,
    trackingNumber: o.trackingNumber,
    createdAt: o.createdAt,
  }));

  return <MerchOrdersDashboard initialOrders={toPlain<PlainMerchOrder[]>(orders)} />;
}
