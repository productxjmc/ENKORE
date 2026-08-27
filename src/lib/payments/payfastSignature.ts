import { createHash } from "node:crypto";

// Ported from the Base44 app's base44/shared/payfastSignature.ts, which is
// genuinely well-engineered — kept close to verbatim. Two adaptations:
//   - Deno.env.get(...) -> process.env, and no live/test key split via a
//     second literal env var name; PAYMENT_TEST_MODE still selects between
//     the _TEST and non-_TEST variants.
//   - The original pulled in the crypto-js npm package because Deno's Web
//     Crypto (SubtleCrypto) has no MD5. Node's built-in `crypto` module
//     already supports MD5 (`createHash('md5')`), so this needs no
//     external dependency at all.
//
// WHY THIS EXISTS (from the original): both payfastNotify and
// payfastSubscriptionWebhook built the signature string from
// Object.keys(data).sort(). Payfast signs the ITN using the parameters in
// the order they were POSTed, not alphabetically, so a genuine callback
// would never match and every real payment notification was rejected.
// Both should import from here instead of rolling their own.
//
// Two other details that silently break the hash:
//   - PHP's urlencode() encodes ! ' ( ) * ~ and turns space into '+';
//     encodeURIComponent does neither. See pfEncode below.

const LIVE_HOST = "https://www.payfast.co.za";
const SANDBOX_HOST = "https://sandbox.payfast.co.za";

export function isTestMode(): boolean {
  return process.env.PAYMENT_TEST_MODE === "true";
}

/**
 * Passphrase must match the one used to SIGN the payment request, so it
 * follows the same test/live split as the initialize route.
 */
export function getPassphrase(): string {
  const test = isTestMode();
  const value = test
    ? process.env.PAYFAST_PASSPHRASE_TEST || process.env.PAYFAST_PASSPHRASE
    : process.env.PAYFAST_PASSPHRASE_LIVE || process.env.PAYFAST_PASSPHRASE;

  if (!value) {
    throw new Error(`Payfast passphrase not configured for ${test ? "test" : "live"} mode`);
  }
  return value;
}

/** PHP urlencode() semantics, which is what Payfast hashes against. */
export function pfEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/[!'()*~]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

/** Parse a urlencoded body into ordered pairs. Order is load-bearing. */
export function parseOrderedForm(rawBody: string): Array<[string, string]> {
  return [...new URLSearchParams(rawBody).entries()];
}

export function toRecord(pairs: Array<[string, string]>): Record<string, string> {
  return Object.fromEntries(pairs);
}

/**
 * Verify an incoming ITN signature.
 * Every posted field except `signature` is included, in received order,
 * empty values included, values trimmed.
 */
export function verifyItnSignature(pairs: Array<[string, string]>, passphrase: string): boolean {
  const received = pairs.find(([k]) => k === "signature")?.[1];
  if (!received) return false;

  const parts = pairs
    .filter(([k]) => k !== "signature")
    .map(([k, v]) => `${k}=${pfEncode(String(v).trim())}`);

  parts.push(`passphrase=${pfEncode(passphrase.trim())}`);

  const expected = createHash("md5").update(parts.join("&")).digest("hex");
  return timingSafeEqualHex(expected, String(received).toLowerCase());
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Ask Payfast to confirm it actually sent this notification.
 *
 * This is the strongest check available because it does not depend on the
 * passphrase staying secret — it still holds even after a credential leak.
 */
export async function confirmWithPayfast(rawBody: string): Promise<boolean> {
  const host = isTestMode() ? SANDBOX_HOST : LIVE_HOST;
  try {
    const res = await fetch(`${host}/eng/query/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: rawBody,
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return false;
    return (await res.text()).trim().toUpperCase().startsWith("VALID");
  } catch (error) {
    console.error("[payfast] validate call failed:", error);
    return false;
  }
}

/** Money comparison tolerant of a gateway round trip. */
export function amountsMatch(a: number, b: number): boolean {
  return Math.abs(a - b) < 0.005;
}
