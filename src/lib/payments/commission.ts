import type { Prisma } from "@prisma/client";

// Ported from payfastNotify's computeCommission (base44/functions/
// payfastNotify/entry.ts) — an active MusicianSubscription means the
// musician has already paid their platform fee upfront, so ENKORE takes
// 0% on top of that; otherwise the FeePlan's percentage applies, falling
// back to 15% if the musician has no fee plan assigned yet. Shared logic:
// every gateway (Payfast, Yoco, Kyshi, PayPal — as those get built) needs
// the identical calculation, not a copy per webhook.
export async function computeCommission(
  tx: Prisma.TransactionClient,
  musicianId: string,
  amount: number,
): Promise<{ musicianEarnings: number; platformFee: number }> {
  const activeSubscription = await tx.musicianSubscription.findFirst({
    where: { musicianId, status: "ACTIVE" },
  });
  if (activeSubscription) {
    return { musicianEarnings: amount, platformFee: 0 };
  }

  const musician = await tx.musician.findUnique({
    where: { id: musicianId },
    include: { feePlan: true },
  });

  const platformPct = musician?.feePlan?.platformCommissionPercentage ?? 15;
  return {
    musicianEarnings: amount * (1 - platformPct / 100),
    platformFee: amount * (platformPct / 100),
  };
}
