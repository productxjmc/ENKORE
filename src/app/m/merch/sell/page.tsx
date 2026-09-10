import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import SellAtVenueForm from "@/components/mobile/SellAtVenueForm";

export default async function MobileSellAtVenuePage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    const items = await tx.merchandise.findMany({ where: { musicianId: musician.id, status: "ACTIVE" } });
    return { items };
  });

  if (!data) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Sell at venue</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>Record a sale you&apos;ve already been paid for in person.</p>
      <div className="mt-5">
        <SellAtVenueForm items={toPlain<{ id: string; name: string; priceZar: number | null; sizes: string[] }[]>(data.items)} />
      </div>
    </div>
  );
}
