import { sendEmail } from "@/lib/email/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkore.co.za";

// Ported from AdminRequirementReview.jsx's two SendEmail calls — sent
// client-side in the Base44 source (a real anti-pattern this rebuild
// fixes: every transactional email here goes through the server route
// that made the decision, same as sendSeasonOfSingingConfirmationEmail).
export async function sendRequirementsApprovedEmail(to: string, artistName: string, storefrontUrl: string | null): Promise<void> {
  const subject = "Your ENKORE profile has been approved!";
  const storefrontLine = storefrontUrl ? `${APP_URL}/${storefrontUrl}` : `${APP_URL}/dashboard`;

  const text = `Hi ${artistName},

Great news — your submitted requirements have been reviewed and approved!

Your storefront is now live at: ${storefrontLine}

Log in to your dashboard to start uploading music and engaging with fans: ${APP_URL}/dashboard

God bless,
The ENKORE Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #FF3700; padding: 32px 24px;">
        <h1 style="color: #fff; font-size: 22px; font-weight: 900; margin: 0;">You're approved!</h1>
      </div>
      <div style="padding: 24px; color: #111;">
        <p style="font-size: 14px; line-height: 1.6;">Hi ${artistName},</p>
        <p style="font-size: 14px; line-height: 1.6;">Great news — your submitted requirements have been reviewed and approved!</p>
        <p style="font-size: 14px; line-height: 1.6;">Your storefront is now live at: <a href="${storefrontLine}">${storefrontLine}</a></p>
        <p style="font-size: 14px; line-height: 1.6;">Log in to your dashboard to start uploading music and engaging with fans: <a href="${APP_URL}/dashboard">${APP_URL}/dashboard</a></p>
        <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">God bless,<br />The ENKORE Team</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html, text });
}

export async function sendRequirementsChangesRequestedEmail(to: string, artistName: string, notes: string): Promise<void> {
  const subject = "Action required: update your ENKORE profile requirements";

  const text = `Hi ${artistName},

Thank you for submitting your profile requirements. Our team has reviewed your submission and needs a few changes before we can activate your storefront.

FEEDBACK:
${notes}

Please log in to your dashboard and resubmit: ${APP_URL}/dashboard/onboarding

If you have any questions, reply to this email.

God bless,
The ENKORE Team`;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto;">
      <div style="background: #FF3700; padding: 32px 24px;">
        <h1 style="color: #fff; font-size: 22px; font-weight: 900; margin: 0;">Action required</h1>
      </div>
      <div style="padding: 24px; color: #111;">
        <p style="font-size: 14px; line-height: 1.6;">Hi ${artistName},</p>
        <p style="font-size: 14px; line-height: 1.6;">Thank you for submitting your profile requirements. Our team has reviewed your submission and needs a few changes before we can activate your storefront.</p>
        <p style="font-size: 13px; line-height: 1.6; color: #666; border-left: 2px solid #FF3700; padding-left: 12px; margin-top: 24px; white-space: pre-wrap;">${notes}</p>
        <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">Please log in to your dashboard and resubmit: <a href="${APP_URL}/dashboard/onboarding">${APP_URL}/dashboard/onboarding</a></p>
        <p style="font-size: 14px; line-height: 1.6; margin-top: 24px;">God bless,<br />The ENKORE Team</p>
      </div>
    </div>
  `;

  await sendEmail({ to, subject, html, text });
}
