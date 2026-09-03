import type { Prisma } from "@prisma/client";
import { computeCommission } from "@/lib/payments/commission";

// Shared webhook-completion logic for a paid ticket purchase — called
// from both the Payfast and Kyshi webhooks' ticket branch. TicketPurchase
// has no dedicated paymentReference field (unlike Purchase/
// SubscriptionPayment), so ticketCode doubles as the payment-matching
// reference — set at initialize time in both initialize-ticket routes.
export async function completeTicketPurchase(
  tx: Prisma.TransactionClient,
  paymentReference: string,
  opts: { confirmedAmount?: number } = {},
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const ticketPurchase = await tx.ticketPurchase.findUnique({ where: { ticketCode: paymentReference } });
  if (!ticketPurchase) return { ok: false, reason: "no matching TicketPurchase for reference " + paymentReference };

  // Idempotency: gateways redeliver notifications.
  if (ticketPurchase.status === "CONFIRMED") return { ok: true };

  const amount = opts.confirmedAmount ?? Number(ticketPurchase.totalAmount);

  await tx.ticketPurchase.update({ where: { id: ticketPurchase.id }, data: { status: "CONFIRMED", totalAmount: amount } });

  const event = await tx.event.findUnique({ where: { id: ticketPurchase.eventId } });
  if (event) {
    const newTicketsSold = event.ticketsSold + ticketPurchase.quantity;
    await tx.event.update({
      where: { id: event.id },
      data: {
        ticketsSold: newTicketsSold,
        revenueGenerated: Number(event.revenueGenerated) + amount,
        status: newTicketsSold >= event.totalTickets ? "SOLD_OUT" : event.status,
      },
    });
  }

  // Ticket revenue counts toward the musician's earnings the same way
  // track-sale revenue does — same computeCommission() this app already
  // uses everywhere else, not a second commission calculation.
  const { musicianEarnings } = await computeCommission(tx, ticketPurchase.musicianId, amount);
  const musician = await tx.musician.findUnique({ where: { id: ticketPurchase.musicianId } });
  if (musician) {
    await tx.musician.update({ where: { id: musician.id }, data: { totalRevenue: Number(musician.totalRevenue) + musicianEarnings } });
  }

  if (ticketPurchase.fanEmail) {
    const fan = await tx.fan.findUnique({ where: { email: ticketPurchase.fanEmail } });
    if (fan) {
      await tx.fan.update({ where: { id: fan.id }, data: { totalSpent: Number(fan.totalSpent) + amount, purchasesCount: fan.purchasesCount + 1 } });
    }
  }

  return { ok: true };
}
