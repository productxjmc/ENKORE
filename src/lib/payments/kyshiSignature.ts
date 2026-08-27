import { createHmac } from "node:crypto";

// Ported from base44/functions/kyshiWebhook/entry.ts's inline verification
// logic, factored out the same way payfastSignature.ts was — every future
// caller (subscription webhooks, once Stage 8 exists) needs the identical
// check, not a copy pasted per handler.
//
// Kyshi's docs don't state whether the signature header is hex or base64
// encoded. The original code assumed base64 via atob(), which would
// silently reject every real webhook if Kyshi actually sends hex —
// documented as already-fixed in the source comments, kept here: accept
// either encoding rather than guess.

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function verifyKyshiSignature(rawBody: string, receivedSignature: string, webhookSecret: string): boolean {
  const digest = createHmac("sha256", webhookSecret).update(rawBody).digest();
  const asHex = digest.toString("hex");
  const asB64 = digest.toString("base64");

  const received = receivedSignature.trim();
  return timingSafeEqual(received.toLowerCase(), asHex) || timingSafeEqual(received, asB64);
}

/**
 * Replay window: reject anything older than 15 minutes so a captured
 * body+signature pair can't be replayed indefinitely. Kyshi sends the
 * send-time in milliseconds via x-kyshi-timestamp.
 */
export function isWithinReplayWindow(timestampHeader: string | null, windowMs = 15 * 60 * 1000): boolean {
  if (!timestampHeader) return true; // no timestamp header — nothing to check against
  const sentAt = Number(timestampHeader);
  if (!Number.isFinite(sentAt) || sentAt <= 0) return true;
  return Math.abs(Date.now() - sentAt) <= windowMs;
}

export function isKyshiTestMode(): boolean {
  return (process.env.PAYMENT_TEST_MODE || "").trim().toLowerCase() === "true";
}

export const KYSHI_BASE_URL_TEST = "https://kyshi-mor-dev-qkuod6snia-nw.a.run.app/api/v1";
export const KYSHI_BASE_URL_PROD = "https://api.kyshi.co/v1";

export function kyshiApiKey(): string | undefined {
  return isKyshiTestMode()
    ? process.env.KYSHI_SECRET_KEY_TEST
    : process.env.KYSHI_SECRET_KEY_PROD || process.env.KYSHI_SECRET_KEY_TEST;
}

export function kyshiBaseUrl(): string {
  return isKyshiTestMode() ? KYSHI_BASE_URL_TEST : KYSHI_BASE_URL_PROD;
}
