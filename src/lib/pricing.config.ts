// ─────────────────────────────────────────────────────────────────────────
// EnKORE — pricing.config.ts
// Single source of truth for all prices shown on the site.
//
// ITEM 1 SCOPE: binary currency — ZAR (South Africa) and USD (outside SA).
// Prices are FIXED price points, never live-FX converted, so R200.00 stays
// R200.00 and US$15.00 stays US$15.00.
//
// ITEM 2 READY: to add Nigeria/Ghana/Kenya/Côte d'Ivoire etc., you only add
//   (a) a CURRENCIES entry, (b) a MARKET_CURRENCY entry, and (c) that
//   currency's amount in each PRICES item. No logic changes needed.
// ─────────────────────────────────────────────────────────────────────────

// Add 'NGN' | 'GHS' | 'KES' | 'XOF' here in item 2.
export type CurrencyCode = 'ZAR' | 'USD';

export interface CurrencyFormat {
  code: CurrencyCode;
  prefix: string;            // shown before amount, e.g. 'R', 'US$'
  suffix?: string;           // shown after amount, if ever needed
  decimals: number;          // 2 for both — R200.00 / US$15.00
  thousands: string;         // grouping separator (see note on ZAR below)
  decimal: string;           // decimal separator
  spaceAfterPrefix: boolean; // 'R200.00' -> false
  label: string;             // human label (used by the item-2 selector)
  taxLabel?: string;         // market-level tax note; ZA subscription is VAT-inclusive
}

export const CURRENCIES: Record<CurrencyCode, CurrencyFormat> = {
  ZAR: {
    code: 'ZAR',
    prefix: 'R',
    decimals: 2,
    thousands: ',',   // -> R50,000.00 (matches how you wrote it). Switch to ' ' for SA-standard R50 000.00
    decimal: '.',
    spaceAfterPrefix: false,
    label: 'South Africa (ZAR)',
    taxLabel: 'VAT incl.',   // R200.00 is VAT-inclusive
  },
  USD: {
    code: 'USD',
    prefix: 'US$',
    decimals: 2,
    thousands: ',',
    decimal: '.',
    spaceAfterPrefix: false,
    label: 'Outside South Africa (USD)',
    // no VAT label — audience is outside SA
  },
};

// ISO 3166-1 alpha-2 country -> currency. Item 1: only ZA is special-cased.
// Item 2 extends: NG:'NGN', GH:'GHS', KE:'KES', CI:'XOF', ...
export const MARKET_CURRENCY: Record<string, CurrencyCode> = {
  ZA: 'ZAR',
};

// Everyone outside a mapped market falls here.
export const DEFAULT_CURRENCY: CurrencyCode = 'USD';

// ── Price catalogue ──────────────────────────────────────────────────────
export interface PriceValue {
  amount: number;
  approximate?: boolean; // true = FX-derived estimate (render with "~"/"approximately")
}

export type PriceKey =
  | 'subscription_monthly'
  | 'commission_cap_annual'
  | 'min_payout';

export const PRICES: Record<PriceKey, Partial<Record<CurrencyCode, PriceValue>>> = {
  // FIXED — no FX, no drift.
  subscription_monthly: {
    ZAR: { amount: 200 },
    USD: { amount: 15 },
  },
  // Cap is an FX estimate outside SA — keep it flagged approximate.
  commission_cap_annual: {
    ZAR: { amount: 50000 },
    USD: { amount: 2750, approximate: true },
  },
  min_payout: {
    ZAR: { amount: 50 },
    USD: { amount: 10 },
  },
};

// ── Currency resolution ──────────────────────────────────────────────────
// Split is by MARKET (registration/residence), not browsing location.
// Precedence: manual override (item 2) > registered market > geo-IP > default.
export interface CurrencyContext {
  override?: CurrencyCode | null; // user's explicit selection — arrives in item 2
  userMarket?: string | null;     // logged-in musician's registered country — WINS over geo
  geoCountry?: string | null;     // country from geo-IP / edge header (CF-IPCountry, x-vercel-ip-country)
}

export function resolveCurrency(ctx: CurrencyContext): CurrencyCode {
  if (ctx.override && ctx.override in CURRENCIES) {
    return ctx.override;
  }
  const country = (ctx.userMarket ?? ctx.geoCountry ?? '').toUpperCase();
  return MARKET_CURRENCY[country] ?? DEFAULT_CURRENCY;
}

// ── Formatter ────────────────────────────────────────────────────────────
export interface FormatOptions {
  withCadence?: boolean; // append '/month' for the subscription
  withTax?: boolean;     // append ' (VAT incl.)' where applicable
}

export function formatPrice(
  key: PriceKey,
  currency: CurrencyCode,
  opts: FormatOptions = {},
): string {
  const cur = CURRENCIES[currency];
  const val = PRICES[key]?.[currency];
  if (!cur || !val) {
    throw new Error(`No price for "${key}" in ${currency}`);
  }

  const fixed = val.amount.toFixed(cur.decimals);
  const [intPart, decPart] = fixed.split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, cur.thousands);
  const body = decPart ? `${grouped}${cur.decimal}${decPart}` : grouped;

  let out = `${cur.prefix}${cur.spaceAfterPrefix ? ' ' : ''}${body}`;
  if (cur.suffix) out += cur.suffix;
  if (val.approximate) out = `~${out}`; // in prose you may prefer "approximately ..."
  if (opts.withCadence && key === 'subscription_monthly') out += '/month';
  if (opts.withTax && cur.taxLabel) out += ` (${cur.taxLabel})`;
  return out;
}

// ── Pricing page: show BOTH lines, emphasise the visitor's own ───────────
export interface SubscriptionLine {
  currency: CurrencyCode;
  audience: string;
  text: string;
  emphasised: boolean;
}

export function subscriptionLines(active: CurrencyCode): SubscriptionLine[] {
  return [
    {
      currency: 'ZAR' as CurrencyCode,
      audience: 'South African musicians',
      text: formatPrice('subscription_monthly', 'ZAR', { withCadence: true, withTax: true }),
    },
    {
      currency: 'USD' as CurrencyCode,
      audience: 'Musicians outside South Africa',
      text: formatPrice('subscription_monthly', 'USD', { withCadence: true }),
    },
  ].map((l) => ({ ...l, emphasised: l.currency === active }));
}

// ── Output examples ──────────────────────────────────────────────────────
// resolveCurrency({ userMarket: 'ZA' })                       -> 'ZAR'
// resolveCurrency({ geoCountry: 'NG' })                       -> 'USD'  (item 1)
// resolveCurrency({ userMarket: 'ZA', geoCountry: 'GB' })     -> 'ZAR'  (market wins)
// formatPrice('subscription_monthly','ZAR',{withCadence:true,withTax:true}) -> 'R200.00/month (VAT incl.)'
// formatPrice('subscription_monthly','USD',{withCadence:true})             -> 'US$15.00/month'
// formatPrice('commission_cap_annual','USD')                               -> '~US$2,750.00'
// formatPrice('min_payout','ZAR')                                          -> 'R50.00'