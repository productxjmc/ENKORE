// ─────────────────────────────────────────────────────────────────────────
// EnKORE — geo.ts
// Determines the currency context for a request and feeds resolveCurrency().
//
// Resolution is SERVER-SIDE so the correct currency is known before render
// (no flash of the wrong price). Order of truth, per your rules:
//   manual override (item-2 selector)  >  registered market  >  geo-IP  >  USD
//
// Country detection tries, in order:
//   1. cached cookie  (cheap, set after first detection)
//   2. CDN/edge header (Cloudflare / Vercel / your proxy — free, no API call)
//   3. hosted geo-IP API  (opt-in fallback, only if no edge header on your host)
// Any failure "fails open" to the USD default — a price always renders.
//
// Sits alongside pricing.config.ts. Tell me your host (Next.js / Cloudflare /
// Express / other) and I'll collapse this to the one idiomatic version.
// ─────────────────────────────────────────────────────────────────────────

import {
  type CurrencyCode,
  type CurrencyContext,
  CURRENCIES,
  MARKET_CURRENCY,
  resolveCurrency,
} from './pricing.config';

export const OVERRIDE_COOKIE = 'enkore_currency'; // written by the item-2 selector
export const GEO_COOKIE = 'enkore_geo';           // cached detected country (ISO alpha-2)

// Minimal request shape so this works across frameworks (Web Request, Next, Express).
export interface RequestLike {
  headers: { get(name: string): string | null } | Record<string, string | string[] | undefined>;
  cookies?: { get(name: string): unknown } | Record<string, string>;
  ip?: string | null;
}

type Source = 'override' | 'market' | 'geo-header' | 'geo-api' | 'default';

// ── Cross-framework readers ───────────────────────────────────────────────
function readHeader(req: RequestLike, name: string): string | null {
  const h = req.headers as any;
  if (h && typeof h.get === 'function') return h.get(name);          // Web/Next Headers
  if (h && typeof h === 'object') {
    const v = h[name] ?? h[name.toLowerCase()];                      // Node/Express
    return Array.isArray(v) ? v[0] ?? null : v ?? null;
  }
  return null;
}

function readCookie(req: RequestLike, name: string): string | null {
  const c = req.cookies as any;
  if (!c) return null;
  if (typeof c.get === 'function') {                                 // Next cookies()
    const v = c.get(name);
    if (v == null) return null;
    return typeof v === 'string' ? v : (v.value ?? null);
  }
  if (typeof c === 'object') return c[name] ?? null;                 // cookie-parser
  return null;
}

// ── Country normalisation ─────────────────────────────────────────────────
// Reject Cloudflare specials (XX=unknown, T1=Tor, A1/A2=anonymizer/satellite)
// and anything that isn't a clean 2-letter code.
const UNKNOWN = new Set(['XX', 'T1', 'A1', 'A2']);
export function normalizeCountry(v: string | null | undefined): string | null {
  if (!v) return null;
  const c = v.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(c) && !UNKNOWN.has(c) ? c : null;
}

// ── Providers ─────────────────────────────────────────────────────────────
// Free: whatever your CDN already injects. Add/remove header names to match.
export function edgeHeaderCountry(req: RequestLike): string | null {
  const raw =
    readHeader(req, 'cf-ipcountry') ??          // Cloudflare
    readHeader(req, 'x-vercel-ip-country') ??   // Vercel
    readHeader(req, 'x-country');               // your own proxy / load balancer
  return normalizeCountry(raw);
}

// Opt-in fallback. Times out fast and fails open so it never blocks a render.
export async function apiLookupCountry(
  ip: string | null,
  opts: { timeoutMs?: number } = {},
): Promise<string | null> {
  if (!ip) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 800);
  try {
    const res = await fetch(`https://ipapi.co/${ip}/country/`, { signal: ctrl.signal });
    if (!res.ok) return null;
    return normalizeCountry((await res.text()).trim());
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Assembler ─────────────────────────────────────────────────────────────
export interface ResolveInput {
  req: RequestLike;
  userMarket?: string | null; // logged-in musician's registered country (from your session)
  useApiFallback?: boolean;    // true only if your host doesn't inject a country header
}

export interface ResolveResult {
  currency: CurrencyCode;
  context: CurrencyContext;
  source: Source;
  /** Freshly detected country not yet cached — persist it in GEO_COOKIE on the response. */
  cacheCountry: string | null;
}

export async function getCurrencyForRequest(input: ResolveInput): Promise<ResolveResult> {
  const { req, userMarket = null, useApiFallback = false } = input;

  // 1. explicit override from the item-2 selector
  const rawOverride = (readCookie(req, OVERRIDE_COOKIE) ?? '').toUpperCase();
  const override = rawOverride in CURRENCIES ? (rawOverride as CurrencyCode) : null;

  // 2. geo: cached cookie -> edge header -> optional API
  let cacheCountry: string | null = null;
  let geoVia: 'geo-header' | 'geo-api' = 'geo-header'; // cached cookie counts as header-class
  let geoCountry = normalizeCountry(readCookie(req, GEO_COOKIE));
  if (!geoCountry) {
    geoCountry = edgeHeaderCountry(req);
    if (!geoCountry && useApiFallback) {
      geoCountry = await apiLookupCountry(req.ip ?? null);
      if (geoCountry) geoVia = 'geo-api';
    }
    if (geoCountry) cacheCountry = geoCountry; // caller should set GEO_COOKIE
  }

  const context: CurrencyContext = { override, userMarket, geoCountry };
  const currency = resolveCurrency(context);

  // Source label mirrors resolveCurrency's precedence (userMarket wins even if unmapped).
  let source: Source;
  if (override) {
    source = 'override';
  } else {
    const effective = userMarket ?? geoCountry;
    const mapped = effective ? MARKET_CURRENCY[effective.toUpperCase()] : undefined;
    if (mapped && userMarket) source = 'market';
    else if (mapped) source = geoVia;
    else source = 'default';
  }

  return { currency, context, source, cacheCountry };
}

// ── Usage ─────────────────────────────────────────────────────────────────
// Next.js (server component / route handler):
//   import { cookies, headers } from 'next/headers';
//   const { currency } = await getCurrencyForRequest({
//     req: { headers: await headers(), cookies: await cookies() },
//     userMarket: session?.user?.market ?? null,
//   });
//   // pass `currency` into subscriptionLines(currency) / formatPrice(...)
//
// Express:
//   const { currency, cacheCountry } = await getCurrencyForRequest({
//     req, userMarket: req.user?.market ?? null, useApiFallback: true,
//   });
//   if (cacheCountry) res.cookie(GEO_COOKIE, cacheCountry, { maxAge: 30*864e5, httpOnly: true });