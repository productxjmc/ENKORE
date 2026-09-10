import type { Prisma } from "@prisma/client";

export type SupporterRank = {
  musicianId: string;
  musicianName: string;
  storefrontUrl: string | null;
  rank: number;
  totalSupporters: number;
};

// A fan's rank among all of a musician's supporters, by total spend —
// Purchase.musicianEarnings + TicketPurchase.totalAmount +
// FanSubscription.totalPaid. Same three sources Phase 5's musician-side
// Community page already aggregates (src/app/m/community/page.tsx),
// just inverted: ranked from the fan's side instead of listed from the
// musician's side. FanSubscription isn't filtered by status — totalPaid
// is a lifetime figure, so a lapsed subscription still counts toward
// how much someone has actually given.
export async function getFanSupportRanks(tx: Prisma.TransactionClient, fanEmail: string): Promise<SupporterRank[]> {
  const [purchases, tickets, subs] = await Promise.all([
    tx.purchase.findMany({ where: { fanEmail, status: "COMPLETED" }, select: { musicianId: true } }),
    tx.ticketPurchase.findMany({ where: { fanEmail, status: "CONFIRMED" }, select: { musicianId: true } }),
    tx.fanSubscription.findMany({ where: { fanEmail }, select: { musicianId: true } }),
  ]);
  const musicianIds = [...new Set([...purchases, ...tickets, ...subs].map((p) => p.musicianId))];
  if (musicianIds.length === 0) return [];

  const musicians = await tx.musician.findMany({ where: { id: { in: musicianIds } }, select: { id: true, musicianName: true, storefrontUrl: true } });

  const ranks: SupporterRank[] = [];
  for (const musician of musicians) {
    const [mPurchases, mTickets, mSubs] = await Promise.all([
      tx.purchase.findMany({ where: { musicianId: musician.id, status: "COMPLETED" }, select: { fanEmail: true, musicianEarnings: true, amountPaid: true } }),
      tx.ticketPurchase.findMany({ where: { musicianId: musician.id, status: "CONFIRMED" }, select: { fanEmail: true, totalAmount: true } }),
      tx.fanSubscription.findMany({ where: { musicianId: musician.id }, select: { fanEmail: true, totalPaid: true } }),
    ]);

    const spendByEmail = new Map<string, number>();
    const add = (email: string | null, amount: number) => {
      if (!email) return;
      spendByEmail.set(email, (spendByEmail.get(email) ?? 0) + amount);
    };
    for (const p of mPurchases) add(p.fanEmail, Number(p.musicianEarnings ?? p.amountPaid));
    for (const t of mTickets) add(t.fanEmail, Number(t.totalAmount));
    for (const s of mSubs) add(s.fanEmail, Number(s.totalPaid));

    const sorted = [...spendByEmail.entries()].sort((a, b) => b[1] - a[1]);
    const rank = sorted.findIndex(([email]) => email === fanEmail) + 1;
    if (rank > 0) {
      ranks.push({ musicianId: musician.id, musicianName: musician.musicianName, storefrontUrl: musician.storefrontUrl, rank, totalSupporters: sorted.length });
    }
  }

  return ranks.sort((a, b) => a.rank - b.rank);
}

export function supporterRankLabel(r: SupporterRank): string {
  if (r.rank === 1) return `You're ${r.musicianName}'s #1 supporter`;
  if (r.rank <= 10) return `You're in ${r.musicianName}'s top 10 supporters`;
  if (r.rank <= 100) return `You're in ${r.musicianName}'s top 100 supporters`;
  return `You're one of ${r.musicianName}'s ${r.totalSupporters} supporters`;
}
