import { Resend } from "resend";

// Lazily constructed so a missing RESEND_API_KEY doesn't crash module
// load (e.g. local dev before the key is set) — only the first actual
// send attempt fails, and callers already treat email as soft-fail
// (see sendEmail below), matching the existing Clerk-invite pattern in
// the approve routes.
let client: Resend | null = null;
function getClient(): Resend | null {
  if (client) return client;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  client = new Resend(apiKey);
  return client;
}

// EMAIL_FROM must be an address on a domain verified in Resend (SPF/DKIM
// DNS records added at the registrar) — sends fail otherwise. No
// hardcoded fallback address: a wrong guess here would silently send
// from a domain that was never verified.
const FROM = process.env.EMAIL_FROM;

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const resend = getClient();
  if (!resend || !FROM) {
    // No provider configured yet — log and move on rather than throw,
    // so every caller can fire-and-forget this without try/catch of its
    // own. Matches the TODO(email provider) comments already scattered
    // across approveMusician/payfastNotify/kyshiNotify: this is exactly
    // the gap those were waiting on.
    console.warn(`[email] RESEND_API_KEY or EMAIL_FROM not set — skipped "${input.subject}" to ${input.to}`);
    return;
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    console.error(`[email] Resend send failed for "${input.subject}" to ${input.to}:`, error);
  }
}
