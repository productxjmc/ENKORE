import type { Prisma } from "@prisma/client";
import { TIER_TO_FEEPLAN_NAME } from "@/lib/payments/subscriptionPricing";

// Shared webhook-completion logic for a paid subscription installment —
// called from both the Payfast and Kyshi webhooks' new subscription
// branch (each already had a stub/TODO comment marking exactly this spot,
// left by the earlier track-purchase-only port of those files). Marking
// SubscriptionPayment PAID and rolling MusicianSubscription to ACTIVE is
// what makes computeCommission() (src/lib/payments/commission.ts) start
// returning 0% platform fee on this musician's track sales — no changes
// needed there, that logic already existed and already worked (it's the
// same mechanism approveSeasonOfSinging's free grant uses).
export async function completeSubscriptionInstallment(
  tx: Prisma.TransactionClient,
  paymentReference: string,
  opts: { gatewayReference?: string } = {},
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const payment = await tx.subscriptionPayment.findFirst({ where: { paymentReference } });
  if (!payment) return { ok: false, reason: "no matching SubscriptionPayment for reference " + paymentReference };

  // Idempotency: gateways redeliver notifications.
  if (payment.status === "PAID") return { ok: true };

  const subscription = await tx.musicianSubscription.findUnique({ where: { id: payment.subscriptionId } });
  if (!subscription) return { ok: false, reason: "orphaned SubscriptionPayment, no MusicianSubscription " + payment.subscriptionId };

  const feePlanName = TIER_TO_FEEPLAN_NAME[payment.tier ?? ""];
  const feePlan = feePlanName ? await tx.feePlan.findFirst({ where: { name: feePlanName } }) : null;
  const termMonths = feePlan?.termMonths ?? 1;

  const now = new Date();
  const periodStart = subscription.startDate ?? now;
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + termMonths);

  await tx.subscriptionPayment.update({
    where: { id: payment.id },
    data: { status: "PAID", paidAt: now, periodStart, periodEnd },
  });

  await tx.musicianSubscription.update({
    where: { id: subscription.id },
    data: {
      status: "ACTIVE",
      startDate: subscription.startDate ?? now,
      endDate: periodEnd,
      nextBillingDate: periodEnd,
      lastPaymentDate: now,
      paymentReference: opts.gatewayReference ?? payment.paymentReference ?? undefined,
    },
  });

  return { ok: true };
}
