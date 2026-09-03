import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import PayoutsDashboard, { type PayoutsData } from "@/components/dashboard/PayoutsDashboard";

// Ported from the Base44 app's src/pages/Payouts.jsx — WITHOUT the
// R100,000/year commission-cap banner/progress bar the source had. Per
// the project's standing "commission cap deliberately skipped for now"
// decision, that logic is deliberately not ported, not missed. Adds
// something the source never had: the bank-details form itself, against
// MusicianPayoutInfo (never Musician.bankName/accountNumber — those
// fields don't exist on Musician in this schema; the source's own
// GrowthRoadmap.jsx/LaunchpadToggle.jsx components disagreed on this
// exact point, MusicianPayoutInfo is the one correct answer here).
export default async function PayoutsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      include: { feePlan: true, payoutInfo: true },
    });
    if (!musician) return null;

    const [purchases, payouts] = await Promise.all([
      tx.purchase.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 100 }),
      tx.payout.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

    return { musician, purchases, payouts };
  });

  if (!data) redirect("/musician-pre-register");
  const { musician, purchases, payouts } = data;

  const completed = purchases.filter((p) => p.status === "COMPLETED");
  const grossRevenue = completed.reduce((s, p) => s + Number(p.amountPaid), 0);
  const totalCommission = completed.reduce((s, p) => s + (Number(p.amountPaid) - Number(p.musicianEarnings ?? 0)), 0);
  const netEarnings = completed.reduce((s, p) => s + Number(p.musicianEarnings ?? 0), 0);

  const totalPaidOut = payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + Number(p.netAmount ?? p.amount), 0);
  const pendingPayouts = payouts.filter((p) => p.status === "PENDING" || p.status === "PROCESSING").reduce((s, p) => s + Number(p.netAmount ?? p.amount), 0);
  const availableBalance = Math.max(0, netEarnings - totalPaidOut - pendingPayouts);

  const commissionRate = musician.feePlan?.platformCommissionPercentage ?? musician.payoutPercentage ?? 15;
  const payoutFrequency = musician.feePlan?.payoutFrequency ?? musician.payoutFrequency ?? "MONTHLY";

  const transactions = [
    ...purchases.map((p) => ({
      id: `s-${p.id}`,
      type: "sale" as const,
      title: p.description || p.fanName || "Music sale",
      date: p.createdAt,
      gross: Number(p.amountPaid),
      commission: Number(p.amountPaid) - Number(p.musicianEarnings ?? 0),
      net: Number(p.musicianEarnings ?? 0),
      status: p.status,
      reference: null as string | null,
    })),
    ...payouts.map((p) => ({
      id: `p-${p.id}`,
      type: "payout" as const,
      title: "Payout",
      date: p.createdAt,
      gross: Number(p.grossRevenue ?? 0),
      commission: Number(p.platformFee ?? 0),
      net: Number(p.netAmount ?? p.amount),
      status: p.status,
      reference: p.paymentReference,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 30);

  const payoutsData: PayoutsData = {
    musicianName: musician.musicianName,
    stats: { grossRevenue, totalCommission, netEarnings, totalPaidOut, pendingPayouts, availableBalance },
    plan: { name: musician.feePlan?.name ?? "Standard", commissionRate, payoutFrequency },
    payoutInfo: musician.payoutInfo ? { bankName: musician.payoutInfo.bankName ?? "", accountNumber: musician.payoutInfo.accountNumber ?? "" } : { bankName: "", accountNumber: "" },
    transactions,
  };

  return <PayoutsDashboard data={toPlain<PayoutsData>(payoutsData)} />;
}
