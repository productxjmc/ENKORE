import { redirect } from "next/navigation";
import { Activity } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

export default async function MobilePartnerActivityPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const affiliate = await tx.affiliate.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!affiliate) return null;
    const conversions = await tx.affiliateConversion.findMany({ where: { affiliateId: affiliate.id }, orderBy: { createdAt: "desc" }, take: 100 });
    return { conversions };
  });

  if (!data) redirect("/m/partner/why");

  const conversions = toPlain<{ id: string; musicianName: string; musicianEmail: string; commissionEarned: number; createdAt: string }[]>(data.conversions);

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Partner</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Referral activity</h1>

      <div className="mt-5 flex flex-col">
        {conversions.map((c) => (
          <div key={c.id} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            <div className="min-w-0">
              <p className="truncate text-[13px] font-bold">{c.musicianName}</p>
              <p className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>{new Date(c.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
            </div>
            <span className="text-[13px] font-extrabold" style={{ color: "var(--m-accent)" }}>+R{c.commissionEarned.toLocaleString()}</span>
          </div>
        ))}
        {conversions.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Activity className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No referrals yet — share your link to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
