import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import PartnerLinkCard from "@/components/mobile/PartnerLinkCard";
import MinistryUpgradeCard from "@/components/mobile/MinistryUpgradeCard";

const TIER_LABELS: Record<string, string> = { COMMUNITY: "Community Partner", MINISTRY: "Ministry Partner", AMBASSADOR: "Ambassador" };

export default async function MobilePartnerPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const affiliate = await withCurrentUser((tx) => tx.affiliate.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } }));
  if (!affiliate) redirect("/m/partner/why");

  const plain = toPlain<{
    referralCode: string;
    tier: "COMMUNITY" | "MINISTRY" | "AMBASSADOR";
    foundingMember: boolean;
    verificationStatus: "NOT_SUBMITTED" | "PENDING" | "APPROVED" | "REJECTED";
    clicks: number;
    conversions: number;
    pendingEarnings: number;
    totalEarningsPaid: number;
    churchMultiplierEarned: number;
  }>(affiliate);

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Partner</p>
      <h1 className="mt-1.5 text-[22px] font-extrabold uppercase tracking-[-0.02em]">{TIER_LABELS[plain.tier]}</h1>
      {plain.foundingMember && <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.08em]" style={{ color: "var(--m-accent)" }}>Founding Partner</p>}
      {plain.verificationStatus === "PENDING" && <p className="mt-1 text-[11px]" style={{ color: "var(--m-text-muted)" }}>Ministry upgrade pending review</p>}

      <div className="mt-5 grid grid-cols-3 gap-[2px]" style={{ background: "var(--m-line)" }}>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold">{plain.clicks}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Clicks</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold">{plain.conversions}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Conversions</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[16px] font-extrabold" style={{ color: "var(--m-accent)" }}>R{plain.pendingEarnings.toLocaleString()}</span>
          <span className="text-[10px] uppercase tracking-[0.06em]" style={{ color: "var(--m-text-muted)" }}>Pending</span>
        </div>
      </div>

      {(plain.tier === "MINISTRY" || plain.tier === "AMBASSADOR") && plain.churchMultiplierEarned > 0 && (
        <p className="mt-3 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
          R{plain.churchMultiplierEarned.toLocaleString()} earned in Church Multiplier bonuses.
        </p>
      )}

      <div className="mt-4">
        <PartnerLinkCard referralCode={plain.referralCode} />
      </div>

      {plain.tier === "COMMUNITY" && plain.verificationStatus === "NOT_SUBMITTED" && (
        <div className="mt-4">
          <MinistryUpgradeCard />
        </div>
      )}

      <p className="mt-4 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
        R{plain.totalEarningsPaid.toLocaleString()} paid to date. Commissions are subject to a 60-day clawback period from the musician&apos;s first payment.
      </p>
    </div>
  );
}
