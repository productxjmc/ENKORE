import Link from "next/link";
import { redirect } from "next/navigation";
import { DollarSign, Users, Download, ArrowUp, ArrowDown, ArrowRight, Wallet, CheckCircle2, Circle } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { formatFromZar } from "@/lib/pricingConfig";
import { COMMISSION_CAP_ZAR, COMMISSION_CAP_WINDOW_DAYS } from "@/lib/payments/commissionCap";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Date.now() is impure and React's purity lint (react-hooks/purity) flags
// it if called directly in a component body — same fix as
// src/app/dashboard/page.tsx's own dateBounds() helper.
function dateBounds() {
  const now = Date.now();
  return {
    oneWeekAgo: new Date(now - 7 * ONE_DAY_MS),
    twoWeeksAgo: new Date(now - 14 * ONE_DAY_MS),
    capWindowStart: new Date(now - COMMISSION_CAP_WINDOW_DAYS * ONE_DAY_MS),
  };
}

// Same query shape as src/app/dashboard/page.tsx, restyled for the
// mobile shell — see that file's own comment for why "my Musician" is
// resolved by userId-or-email. Kept as a server component throughout
// (Growth Roadmap here is pure links, no client state needed) rather
// than a client shell like the desktop version's MusicianDashboardShell.
export default async function MobileStudioPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const { oneWeekAgo, twoWeeksAgo, capWindowStart } = dateBounds();

    const [tracks, purchases, follows, payoutInfo, merchCount, capPurchases] = await Promise.all([
      tx.track.findMany({ where: { musicianId: musician.id }, select: { id: true, downloadsCount: true } }),
      tx.purchase.findMany({ where: { musicianId: musician.id, status: "COMPLETED" }, orderBy: { createdAt: "desc" }, take: 200 }),
      tx.follow.count({ where: { musicianId: musician.id } }),
      tx.musicianPayoutInfo.findUnique({ where: { musicianId: musician.id } }),
      tx.merchandise.count({ where: { musicianId: musician.id } }),
      tx.purchase.findMany({ where: { musicianId: musician.id, status: "COMPLETED", createdAt: { gte: capWindowStart } }, select: { platformFee: true } }),
    ]);

    return { musician, tracks, purchases, follows, payoutInfo, merchCount, capPurchases, oneWeekAgo, twoWeeksAgo };
  });

  if (!data) redirect("/musician-pre-register");
  const { musician, tracks, purchases, follows, payoutInfo, merchCount, capPurchases, oneWeekAgo, twoWeeksAgo } = data;

  const payoutComplete = Boolean(payoutInfo?.bankName && payoutInfo?.accountNumber);
  const thisWeekPurchases = purchases.filter((p) => p.createdAt >= oneWeekAgo);
  const lastWeekPurchases = purchases.filter((p) => p.createdAt >= twoWeeksAgo && p.createdAt < oneWeekAgo);
  const thisWeekRevenue = thisWeekPurchases.reduce((s, p) => s + Number(p.musicianEarnings ?? 0), 0);
  const lastWeekRevenue = lastWeekPurchases.reduce((s, p) => s + Number(p.musicianEarnings ?? 0), 0);
  const revenueTrend = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : null;
  const totalDownloads = tracks.reduce((s, t) => s + t.downloadsCount, 0);

  const capTaken = capPurchases.reduce((s, p) => s + Number(p.platformFee ?? 0), 0);
  const capPercent = Math.min(100, Math.round((capTaken / COMMISSION_CAP_ZAR) * 100));

  const roadmapSteps = [
    { label: "Submit profile requirements", done: musician.requirementsStatus === "APPROVED", href: "/dashboard/onboarding" },
    { label: "Add your bank & payout details", done: payoutComplete, href: "/m/payouts" },
    { label: "Upload your first track", done: tracks.length > 0, href: "/dashboard/upload-track" },
    { label: "List a merchandise item", done: merchCount > 0, href: "/dashboard/merchandise" },
    { label: "Launch your storefront (go live)", done: musician.isLive, href: "/dashboard" },
    { label: "Get your first 5 followers", done: follows >= 5, href: "/m/dash" },
    { label: "Make your first sale", done: purchases.length > 0, href: "/m/dash" },
  ];
  const roadmapDone = roadmapSteps.filter((s) => s.done).length;
  const roadmapPercent = Math.round((roadmapDone / roadmapSteps.length) * 100);
  const nextStep = roadmapSteps.find((s) => !s.done);

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">{musician.musicianName}</h1>
      {musician.storefrontUrl && <p className="mt-1 text-[12px]" style={{ color: "var(--m-text-muted)" }}>enkoremusic.africa/{musician.storefrontUrl}</p>}

      <div className="mt-5 grid grid-cols-2 gap-[2px]" style={{ background: "var(--m-line)" }}>
        <div className="flex flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
          <DollarSign className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
          <span className="text-[18px] font-extrabold">{formatFromZar(Number(musician.totalRevenue), "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Total revenue</span>
        </div>
        <div className="flex flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="flex items-center gap-1 text-[11px] font-bold" style={{ color: revenueTrend === null ? "var(--m-text-faint)" : revenueTrend >= 0 ? "#1a7f37" : "var(--m-accent)" }}>
            {revenueTrend !== null && (revenueTrend >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
            {revenueTrend !== null ? `${Math.abs(revenueTrend).toFixed(0)}%` : "—"}
          </span>
          <span className="text-[18px] font-extrabold">{formatFromZar(thisWeekRevenue, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>This week</span>
        </div>
        <div className="flex flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
          <Users className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
          <span className="text-[18px] font-extrabold">{follows}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Followers</span>
        </div>
        <div className="flex flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
          <Download className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
          <span className="text-[18px] font-extrabold">{totalDownloads}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Downloads</span>
        </div>
      </div>

      <div className="mt-4 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Commission cap</p>
          <span className="text-[11px] font-bold">{capPercent}%</span>
        </div>
        <div className="mt-2 h-1.5 w-full" style={{ background: "var(--m-line)" }}>
          <div className="h-full" style={{ width: `${capPercent}%`, background: "var(--m-accent)" }} />
        </div>
        <p className="mt-2 text-[12px]" style={{ color: "var(--m-text-muted)" }}>
          {formatFromZar(capTaken, "ZAR")} of {formatFromZar(COMMISSION_CAP_ZAR, "ZAR")} taken this year — then commission stops until it resets.
        </p>
      </div>

      <div className="mt-4 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Growth roadmap</p>
          <span className="text-[11px] font-bold">{roadmapDone}/{roadmapSteps.length}</span>
        </div>
        <div className="mt-2 h-1.5 w-full" style={{ background: "var(--m-line)" }}>
          <div className="h-full" style={{ width: `${roadmapPercent}%`, background: "var(--m-accent)" }} />
        </div>

        {nextStep && (
          <Link href={nextStep.href} className="mt-3 flex min-h-14 items-center justify-between border-2 px-3" style={{ borderColor: "var(--m-line)" }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--m-accent)" }}>Next step</p>
              <p className="text-[13px] font-bold">{nextStep.label}</p>
            </div>
            <ArrowRight className="h-4 w-4 flex-none" />
          </Link>
        )}

        <div className="mt-3 flex flex-col gap-2">
          {roadmapSteps.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-[12px]">
              {s.done ? <CheckCircle2 className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} /> : <Circle className="h-4 w-4 flex-none" style={{ color: "var(--m-text-faint)" }} />}
              <span style={{ color: s.done ? "var(--m-text-faint)" : "var(--m-ink)", textDecoration: s.done ? "line-through" : "none" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      <Link href="/m/payouts" className="mt-4 flex min-h-14 w-full items-center justify-between border-2 px-4 text-[13px] font-bold" style={{ borderColor: "var(--m-line)" }}>
        <span className="flex items-center gap-2">
          <Wallet className="h-4 w-4" style={{ color: "var(--m-accent)" }} />
          Payouts &amp; earnings
        </span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
