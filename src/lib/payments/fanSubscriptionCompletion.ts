import type { Prisma } from "@prisma/client";

// FanSubscription has no separate pending-payment sub-table (unlike
// MusicianSubscription/SubscriptionPayment) — per prisma/rls.sql's own
// comment on fansubscription_write, the row is "created server-side once
// the first payment clears," not pre-created PENDING at initialize time.
// So unlike completeTicketPurchase/completeSubscriptionInstallment (which
// look up an existing row), this one CREATES the row here, using the
// details the initialize route encoded into the gateway's custom-data
// field (custom_str1 for Payfast, meta for Kyshi) since there was nowhere
// in the DB to stash them first.
export type FanSubscriptionWebhookData = {
  reference: string;
  musicianId: string;
  fanEmail: string;
  fanName?: string;
  amount: number;
  currency: string;
};

export async function completeFanSubscription(
  tx: Prisma.TransactionClient,
  data: FanSubscriptionWebhookData,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  // Idempotency: gateways redeliver notifications. paymentReference isn't
  // a unique column (see schema comment), so check explicitly.
  const existing = await tx.fanSubscription.findFirst({ where: { paymentReference: data.reference } });
  if (existing) return { ok: true };

  const musician = await tx.musician.findUnique({ where: { id: data.musicianId } });
  if (!musician) return { ok: false, reason: "musician not found: " + data.musicianId };

  const now = new Date();
  const nextBillingDate = new Date(now);
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

  let fan = await tx.fan.findUnique({ where: { email: data.fanEmail } });
  if (!fan) {
    fan = await tx.fan.create({ data: { fullName: data.fanName || undefined, email: data.fanEmail } });
  }

  await tx.fanSubscription.create({
    data: {
      fanId: fan.id,
      musicianId: data.musicianId,
      fanName: data.fanName,
      fanEmail: data.fanEmail,
      amount: data.amount,
      frequency: "MONTHLY",
      status: "ACTIVE",
      startDate: now,
      nextBillingDate,
      lastPaymentDate: now,
      totalPaid: data.amount,
      paymentReference: data.reference,
    },
  });

  await tx.musician.update({
    where: { id: musician.id },
    data: { totalRevenue: Number(musician.totalRevenue) + data.amount },
  });

  return { ok: true };
}
