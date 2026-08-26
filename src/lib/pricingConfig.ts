// Ported verbatim from the Base44 app's src/lib/pricingConfig.js — single
// source of truth for every price shown on the site. Fixed price points,
// never live-FX converted. Add a market by extending CURRENCIES +
// MARKET_CURRENCY + each PRICES entry; no logic changes needed.

export type CurrencyCode = "ZAR" | "USD" | "NGN" | "GHS" | "KES" | "XOF";

type CurrencyMeta = {
  code: CurrencyCode;
  prefix: string;
  decimals: number;
  thousands: string;
  decimal: string;
  spaceAfterPrefix: boolean;
  label: string;
  taxLabel?: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  ZAR: { code: "ZAR", prefix: "R", decimals: 2, thousands: ",", decimal: ".", spaceAfterPrefix: false, label: "South Africa (ZAR)", taxLabel: "VAT incl." },
  USD: { code: "USD", prefix: "US$", decimals: 2, thousands: ",", decimal: ".", spaceAfterPrefix: false, label: "Outside Africa (USD)" },
  NGN: { code: "NGN", prefix: "₦", decimals: 0, thousands: ",", decimal: ".", spaceAfterPrefix: false, label: "Nigeria (NGN)" },
  GHS: { code: "GHS", prefix: "GH₵", decimals: 2, thousands: ",", decimal: ".", spaceAfterPrefix: false, label: "Ghana (GHS)" },
  KES: { code: "KES", prefix: "KSh", decimals: 0, thousands: ",", decimal: ".", spaceAfterPrefix: true, label: "Kenya (KES)" },
  XOF: { code: "XOF", prefix: "CFA", decimals: 0, thousands: " ", decimal: ".", spaceAfterPrefix: true, label: "Côte d'Ivoire / Franc West Africa (XOF)" },
};

// ISO 3166-1 alpha-2 country -> currency.
export const MARKET_CURRENCY: Record<string, CurrencyCode> = {
  ZA: "ZAR",
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  CI: "XOF",
  SN: "XOF",
  BF: "XOF",
  ML: "XOF",
  BJ: "XOF",
  TG: "XOF",
  NE: "XOF",
};
export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const SELECTABLE_COUNTRIES: { code: string; name: string; currency: CurrencyCode; flag: string }[] = [
  { code: "ZA", name: "South Africa", currency: "ZAR", flag: "🇿🇦" },
  { code: "NG", name: "Nigeria", currency: "NGN", flag: "🇳🇬" },
  { code: "GH", name: "Ghana", currency: "GHS", flag: "🇬🇭" },
  { code: "KE", name: "Kenya", currency: "KES", flag: "🇰🇪" },
  { code: "CI", name: "Côte d'Ivoire", currency: "XOF", flag: "🇨🇮" },
  { code: "US", name: "Outside Africa", currency: "USD", flag: "🌍" },
];

// Precedence: manual override (currency selector) > registered market > geo-IP > default.
export function resolveCurrency({
  override = null,
  userMarket = null,
  geoCountry = null,
}: {
  override?: string | null;
  userMarket?: string | null;
  geoCountry?: string | null;
} = {}): CurrencyCode {
  if (override && override in CURRENCIES) return override as CurrencyCode;
  const country = (userMarket ?? geoCountry ?? "").toUpperCase();
  return MARKET_CURRENCY[country] ?? DEFAULT_CURRENCY;
}

// Fixed exchange rates derived from the subscription price points (R200 base).
// Used to convert ZAR-stored prices (tracks, merch) into the visitor's currency.
export const ZAR_RATES: Record<CurrencyCode, number> = {
  ZAR: 1,
  USD: 0.075, // R200 = US$15
  NGN: 32.5, // R200 = ₦6,500
  GHS: 0.475, // R200 = GH₵95
  KES: 9.75, // R200 = KSh 1,950
  XOF: 45, // R200 = CFA 9,000
};

export function convertFromZar(amountZar: number, currency: CurrencyCode): number {
  return amountZar * ZAR_RATES[currency];
}

export function formatAmount(amount: number, currency: CurrencyCode, opts: { approximate?: boolean; withTax?: boolean } = {}): string {
  const cur = CURRENCIES[currency];
  const fixed = amount.toFixed(cur.decimals);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, cur.thousands);
  const body = decPart ? `${grouped}${cur.decimal}${decPart}` : grouped;
  let out = `${cur.prefix}${cur.spaceAfterPrefix ? " " : ""}${body}`;
  if (opts.approximate) out = `~${out}`;
  if (opts.withTax && cur.taxLabel) out += ` (${cur.taxLabel})`;
  return out;
}

export function formatFromZar(amountZar: number, currency: CurrencyCode, opts: { approximate?: boolean; withTax?: boolean } = {}): string {
  return formatAmount(convertFromZar(amountZar, currency), currency, opts);
}
