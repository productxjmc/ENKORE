import { sendEmail } from "@/lib/email/resend";

// Ported from createMerchOrder/entry.ts's inline SendEmail call — already
// server-side there (unlike AdminRequirementReview.jsx's client-side
// anti-pattern), just routed through this app's real provider instead.
export async function sendNewMerchOrderEmail(
  musicianEmail: string,
  opts: { itemName: string; size: string; quantity: number; currency: string; total: number; fanName: string; fanEmail: string },
): Promise<void> {
  const subject = `New Merch Order: ${opts.itemName}`;

  const text = `You have a new merchandise order.

Item: ${opts.itemName}
Size: ${opts.size || "n/a"}
Quantity: ${opts.quantity}
Total: ${opts.currency} ${opts.total.toFixed(2)}

Fan: ${opts.fanName} (${opts.fanEmail})

Manage this order from your ENKORE dashboard.`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #FF3700; padding: 32px 24px;">
        <h1 style="color: #fff; font-size: 22px; font-weight: 900; margin: 0;">New merch order</h1>
      </div>
      <div style="padding: 24px; color: #111;">
        <p style="font-size: 14px; line-height: 1.6;"><strong>${opts.itemName}</strong>${opts.size ? ` (${opts.size})` : ""} &times; ${opts.quantity}</p>
        <p style="font-size: 14px; line-height: 1.6;">Total: <strong>${opts.currency} ${opts.total.toFixed(2)}</strong></p>
        <p style="font-size: 14px; line-height: 1.6;">From: ${opts.fanName} (${opts.fanEmail})</p>
        <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">Manage this order from your ENKORE dashboard.</p>
      </div>
    </div>
  `;

  await sendEmail({ to: musicianEmail, subject, html, text });
}
