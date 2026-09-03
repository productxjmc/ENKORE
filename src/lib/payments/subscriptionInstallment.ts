import type { Prisma } from "@prisma/client";
import { SUBSCRIPTION_REMINDER_DAYS_BEFORE } from "@/lib/payments/subscriptionPricing";

// Shared "prepare one installment" logic, used by both
// initialize-subscription routes (Payfast and Kyshi) — the gateway-
// specific code only differs in how it actually talks to the payment
// provider afterward. Ported from the reasoning in base44/functions/
// initializeKyshiSubscription/entry.ts (the newer, tier-based function —
// initializePayfastSubscription/entry.ts in the same export is a stale,
// pre-tier version that set up a recurring Payfast subscription, which
// directly contradicts this schema's own SubscriptionPayment doc comment:
// "ENKORE does not auto-debit; each installment is invoiced and paid
// individually" — not ported, a one-time-payment version built to the
// same, actually-correct contract as the Kyshi function instead).
//
// Must run inside a withServiceRole transaction: MusicianSubscription and
// SubscriptionPayment both require app.is_admin() to insert (see
// prisma/rls.sql) — the caller's identity is verified by the route before
// this ever runs, not by this function.
export async function prepareSubscriptionInstallment(
  tx: Prisma.TransactionClient,
  musicianId: string,
  musicianEmail: string,
  tierName: "Soundcheck" | "Mainstage" | "Headliner",
  amount: number,
  currency: string,
  gateway: "PAYFAST" | "KYSHI",
): Promise<{ status: 409; error: string; nextBillingDate: Date } | { status: 200; subscriptionId: string; paymentId: string; reference: string }> {
  const tierEnum = tierName.toUpperCase() as "SOUNDCHECK" | "MAINSTAGE" | "HEADLINER";

  let subscription = await tx.musicianSubscription.findFirst({ where: { musicianId } });

  if (subscription && subscription.status === "ACTIVE") {
    const due = subscription.nextBillingDate;
    const sameTier = subscription.subscriptionType === tierName;
    if (due && sameTier) {
      const daysOut = Math.ceil((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysOut > SUBSCRIPTION_REMINDER_DAYS_BEFORE) {
        return { status: 409, error: `Your next installment is not due until ${due.toISOString().slice(0, 10)}.`, nextBillingDate: due };
      }
    }
  }

  if (!subscription) {
    subscription = await tx.musicianSubscription.create({
      data: { musicianId, status: "PENDING", subscriptionType: tierName, amount, currency: currency as "ZAR" | "NGN" | "KES" | "GHS" },
    });
  } else if (subscription.subscriptionType !== tierName) {
    // A musician may be upgrading tiers at renewal — keep the record current.
    subscription = await tx.musicianSubscription.update({
      where: { id: subscription.id },
      data: { subscriptionType: tierName, amount, currency: currency as "ZAR" | "NGN" | "KES" | "GHS" },
    });
  }

  const reference = `ENKORE-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  // Reuse a pending installment if one already exists (e.g. a musician
  // retrying after an abandoned checkout) rather than creating a second
  // record for the same payment.
  let payment = await tx.subscriptionPayment.findFirst({ where: { subscriptionId: subscription.id, status: "PENDING" } });
  if (payment) {
    payment = await tx.subscriptionPayment.update({
      where: { id: payment.id },
      data: { tier: tierEnum, amount, currency: currency as "ZAR" | "NGN" | "KES" | "GHS", gateway, paymentReference: reference },
    });
  } else {
    payment = await tx.subscriptionPayment.create({
      data: {
        subscriptionId: subscription.id,
        musicianId,
        musicianEmail,
        tier: tierEnum,
        amount,
        currency: currency as "ZAR" | "NGN" | "KES" | "GHS",
        gateway,
        status: "PENDING",
        dueDate: subscription.nextBillingDate ?? new Date(),
        paymentReference: reference,
      },
    });
  }

  return { status: 200, subscriptionId: subscription.id, paymentId: payment.id, reference };
}
