import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import { formatFromZar } from "@/lib/pricingConfig";
import { COMMISSION_CAP_ZAR, COMMISSION_CAP_WINDOW_DAYS } from "@/lib/payments/commissionCap";
import BankDetailsForm from "@/components/mobile/BankDetailsForm";
import SubscriptionInstallmentCard from "@/components/mobile/SubscriptionInstallmentCard";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Date.now() is impure and React's purity lint (react-hooks/purity) flags
// it if called directly in a component body — same fix as
// src/app/dashboard/page.tsx's own dateBounds() helper.
function capWindowStart(): Date {
  return new Date(Date.now() - COMMISSION_CAP_WINDOW_DAYS * ONE_DAY_MS);
}

// Same query shape as src/app/dashboard/payouts/page.tsx — see that
// file's own comment on why MusicianPayoutInfo, not Musician.bankName
// (which doesn't exist on this schema).
export default async function MobilePayoutsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      include: { payoutInfo: true },
    });
    if (!musician) return null;

    const [purchases, payouts, subscription] = await Promise.all([
      tx.purchase.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 100 }),
      tx.payout.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      tx.musicianSubscription.findFirst({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } }),
    ]);

    const windowStart = capWindowStart();
    const capTaken = purchases
      .filter((p) => p.status === "COMPLETED" && p.createdAt >= windowStart)
      .reduce((s, p) => s + Number(p.platformFee ?? 0), 0);

    return { musician, purchases, payouts, subscription, capTaken };
  });

  if (!data) redirect("/musician-pre-register");
  const { musician, purchases, payouts, subscription, capTaken } = data;

  const completed = purchases.filter((p) => p.status === "COMPLETED");
  const netEarnings = completed.reduce((s, p) => s + Number(p.musicianEarnings ?? 0), 0);
  const totalPaidOut = payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + Number(p.netAmount ?? p.amount), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").reduce((s, p) => s + Number(p.netAmount ?? p.amount), 0);
  const availableBalance = Math.max(0, netEarnings - totalPaidOut - pendingPayouts);
  const capPercent = Math.min(100, Math.round((capTaken / COMMISSION_CAP_ZAR) * 100));

  const transactions = [
    ...purchases.map((p) => ({
      id: `s-${p.id}`,
      title: p.description || p.fanName || "Music sale",
      date: p.createdAt.toISOString(),
      net: Number(p.musicianEarnings ?? 0),
      status: p.status,
    })),
    ...payouts.map((p) => ({
      id: `p-${p.id}`,
      title: "Payout",
      date: p.createdAt.toISOString(),
      net: -Number(p.netAmount ?? p.amount),
      status: p.status,
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Payouts &amp; earnings</h1>

      <div className="mt-5 grid grid-cols-2 gap-[2px]" style={{ background: "var(--m-line)" }}>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[18px] font-extrabold" style={{ color: "var(--m-accent)" }}>{formatFromZar(availableBalance, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Available</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[18px] font-extrabold">{formatFromZar(netEarnings, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Net earnings, all time</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[18px] font-extrabold">{formatFromZar(totalPaidOut, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Paid out</span>
        </div>
        <div className="flex flex-col gap-1 p-3" style={{ background: "var(--m-ground)" }}>
          <span className="text-[18px] font-extrabold">{formatFromZar(pendingPayouts, "ZAR")}</span>
          <span className="text-[10px] uppercase tracking-[0.08em]" style={{ color: "var(--m-text-muted)" }}>Pending</span>
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
          {formatFromZar(capTaken, "ZAR")} of {formatFromZar(COMMISSION_CAP_ZAR, "ZAR")} taken this year.
        </p>
      </div>

      <div className="mt-4">
        <SubscriptionInstallmentCard
          musicianId={musician.id}
          country={musician.country}
          selectedPlan={musician.selectedPlan}
          subscription={
            subscription
              ? toPlain({ status: subscription.status, subscriptionType: subscription.subscriptionType, nextBillingDate: subscription.nextBillingDate })
              : null
          }
        />
      </div>

      <div className="mt-4">
        <BankDetailsForm initialBankName={musician.payoutInfo?.bankName ?? ""} initialAccountNumber={musician.payoutInfo?.accountNumber ?? ""} />
      </div>

      <div className="mt-4 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Recent activity</p>
        <div className="flex flex-col">
          {transactions.map((t) => (
            <div key={t.id} className="flex items-center justify-between border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
              <div className="min-w-0">
                <p className="truncate text-[13px] font-bold">{t.title}</p>
                <p className="text-[11px]" style={{ color: "var(--m-text-faint)" }}>{new Date(t.date).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}</p>
              </div>
              <span className="text-[13px] font-extrabold" style={{ color: t.net >= 0 ? "var(--m-ink)" : "var(--m-text-muted)" }}>
                {t.net >= 0 ? "+" : ""}{formatFromZar(t.net, "ZAR")}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <p className="py-8 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>No activity yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
