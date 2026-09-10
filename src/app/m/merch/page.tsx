import Link from "next/link";
import { redirect } from "next/navigation";
import { ShoppingBag, PackageCheck } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import MerchandiseList from "@/components/mobile/MerchandiseList";

export default async function MobileMerchPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    const items = await tx.merchandise.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } });
    return { items, musicianId: musician.id };
  });

  if (!data) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Merchandise</h1>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href="/m/merch/sell" className="flex min-h-14 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
          <ShoppingBag className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />
          Sell at venue
        </Link>
        <Link href="/m/merch/orders" className="flex min-h-14 items-center gap-2 border-2 px-3 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
          <PackageCheck className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />
          Orders
        </Link>
      </div>

      <div className="mt-5">
        <MerchandiseList initialItems={toPlain(data.items)} musicianId={data.musicianId} />
      </div>
    </div>
  );
}
