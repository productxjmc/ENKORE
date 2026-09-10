import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import MerchOrdersList from "@/components/mobile/MerchOrdersList";

export default async function MobileMerchOrdersPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [orders, merchandise] = await Promise.all([
      tx.merchandiseOrder.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 100 }),
      tx.merchandise.findMany({ where: { musicianId: musician.id }, select: { id: true, name: true } }),
    ]);
    return { orders, merchandise };
  });

  if (!data) redirect("/musician-pre-register");

  const nameById = Object.fromEntries(data.merchandise.map((m) => [m.id, m.name]));
  const orders = data.orders.map((o) => ({
    id: o.id,
    itemName: nameById[o.merchandiseId] ?? "Merchandise item",
    quantity: o.quantity,
    size: o.size,
    totalAmount: Number(o.totalAmount),
    fanName: o.fanName,
    status: o.status,
    createdAt: o.createdAt,
  }));

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Merch orders</h1>
      <div className="mt-5">
        <MerchOrdersList initialOrders={toPlain(orders)} />
      </div>
    </div>
  );
}
