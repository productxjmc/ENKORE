import { sendEmail } from "@/lib/email/resend";

// Sent right after a Season of Singing application is submitted — an
// acknowledgement, not an acceptance. Copy pulled from the FAQ/term
// sheet's own language ("we read every application ourselves") rather
// than inventing new phrasing, matching the confirmation page's copy.
export async function sendSeasonOfSingingConfirmationEmail(to: string, artistName: string): Promise<void> {
  const subject = "You're in the running — Season of Singing";

  const text = `Hey ${artistName},

Your Season of Singing application is in. We read every application ourselves.

If you're one of the first 100 accepted, we'll reach out with onboarding steps. The earlier you applied, the more free selling time you get once your page launches — so keep an eye on your inbox and WhatsApp.

Quick recap of what you applied for: full ENKORE platform access — selling music, merch, tickets, everything — free for 3 months, zero ENKORE commission.

— The ENKORE team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #FF3700; padding: 32px 24px;">
        <p style="color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase; margin: 0 0 8px;">Season of Singing</p>
        <h1 style="color: #fff; font-size: 24px; font-weight: 900; margin: 0;">You're in the running.</h1>
      </div>
      <div style="padding: 24px; color: #111;">
        <p style="font-size: 14px; line-height: 1.6;">Hey ${artistName},</p>
        <p style="font-size: 14px; line-height: 1.6;">Your Season of Singing application is in. We read every application ourselves.</p>
        <p style="font-size: 14px; line-height: 1.6;">If you're one of the first 100 accepted, we'll reach out with onboarding steps. The earlier you applied, the more free selling time you get once your page launches — so keep an eye on your inbox and WhatsApp.</p>
        <p style="font-size: 13px; line-height: 1.6; color: #666; border-left: 2px solid #FF3700; padding-left: 12px; margin-top: 24px;">
          Quick recap of what you applied for: full ENKORE platform access — selling music, merch, tickets, everything —
          free for 3 months, zero ENKORE commission.
        </p>
        <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">— The ENKORE team</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html, text });
}
