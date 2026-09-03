import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import MusicianDashboardShell, { type DashboardData } from "@/components/dashboard/MusicianDashboardShell";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Date.now() is impure and React's purity lint (react-hooks/purity) flags
// it if called directly in a component body — pulled out to a plain
// helper, same fix as src/components/admin/SlaBadge.tsx.
function dateBounds() {
  const now = Date.now();
  return {
    oneWeekAgo: new Date(now - 7 * ONE_DAY_MS),
    twoWeeksAgo: new Date(now - 14 * ONE_DAY_MS),
    oneDayAgo: new Date(now - ONE_DAY_MS),
  };
}

// Phase 1 of the musician dashboard build — replaces the smoke-test
// placeholder. Resolves "my Musician" the same way src/app/partners/page.tsx
// resolves "my Affiliate" (userId match, falling back to email — a musician
// row can exist before its User row is linked, e.g. approved via
// musician-pre-register before the musician ever signs in), computes the
// stats Base44's MusicianDashboard.jsx computed client-side server-side
// instead, and passes a single toPlain()'d payload to the client shell.
//
// If the caller has no Musician row at all, they've never been approved —
// send them to apply rather than showing an empty dashboard for a musician
// account that doesn't exist.
export default async function DashboardPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [tracks, purchases, follows, messages, goals] = await Promise.all([
      tx.track.findMany({ where: { musicianId: musician.id }, orderBy: { downloadsCount: "desc" } }),
      tx.purchase.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" }, take: 50 }),
      tx.follow.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } }),
      tx.message.findMany({ where: { musicianId: musician.id, senderType: "FAN" }, orderBy: { createdAt: "desc" }, take: 20 }),
      tx.goal.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } }),
    ]);

    return { musician, tracks, purchases, follows, messages, goals };
  });

  if (!data) redirect("/musician-pre-register");

  const { musician, tracks, purchases, follows, messages, goals } = data;

  const { oneWeekAgo, twoWeeksAgo, oneDayAgo } = dateBounds();

  const completedPurchases = purchases.filter((p) => p.status === "COMPLETED");
  const thisWeekPurchases = completedPurchases.filter((p) => p.createdAt >= oneWeekAgo);
  const lastWeekPurchases = completedPurchases.filter((p) => p.createdAt >= twoWeeksAgo && p.createdAt < oneWeekAgo);
  const thisWeekRevenue = thisWeekPurchases.reduce((sum, p) => sum + Number(p.musicianEarnings ?? 0), 0);
  const lastWeekRevenue = lastWeekPurchases.reduce((sum, p) => sum + Number(p.musicianEarnings ?? 0), 0);
  const revenueTrend = lastWeekRevenue > 0 ? ((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : null;

  const spendByFan = completedPurchases.reduce<Record<string, number>>((acc, p) => {
    if (p.fanName) acc[p.fanName] = (acc[p.fanName] ?? 0) + Number(p.musicianEarnings ?? 0);
    return acc;
  }, {});
  const topFanName = Object.entries(spendByFan).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  const recentActivity = [
    ...purchases.slice(0, 5).map((p) => ({
      type: "purchase" as const,
      title: p.fanName || "Anonymous Fan",
      description: "Purchased a track",
      date: p.createdAt,
      amount: Number(p.musicianEarnings ?? p.amountPaid),
      isNew: p.createdAt >= oneDayAgo,
      isTopFan: Boolean(topFanName && p.fanName === topFanName),
    })),
    ...messages.slice(0, 2).map((m) => ({
      type: "message" as const,
      title: m.fanName || "A fan",
      description: m.subject || "Sent you a message",
      date: m.createdAt,
      amount: null,
      isNew: m.createdAt >= oneDayAgo,
      isTopFan: false,
    })),
    ...follows.slice(0, 3).map((f) => ({
      type: "follow" as const,
      title: f.fanName || "New supporter",
      description: "Started following you",
      date: f.createdAt,
      amount: null,
      isNew: f.createdAt >= oneDayAgo,
      isTopFan: Boolean(topFanName && f.fanName === topFanName),
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 8);

  const dashboardData = {
    musician,
    tracks,
    goals,
    stats: {
      totalRevenue: Number(musician.totalRevenue),
      totalTracks: tracks.length,
      totalFollowers: follows.length,
      totalDownloads: tracks.reduce((sum, t) => sum + t.downloadsCount, 0),
      revenueTrend,
      thisWeekFollows: follows.filter((f) => f.createdAt >= oneWeekAgo).length,
      thisWeekDownloads: thisWeekPurchases.length,
    },
    salesBreakdown: {
      thisWeekRevenue,
      lastWeekRevenue,
      allTimeRevenue: completedPurchases.reduce((sum, p) => sum + Number(p.musicianEarnings ?? 0), 0),
      allTimeSales: completedPurchases.length,
    },
    recentActivity,
  };

  return <MusicianDashboardShell data={toPlain<DashboardData>(dashboardData)} />;
}
