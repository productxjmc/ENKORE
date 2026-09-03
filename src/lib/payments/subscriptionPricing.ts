import { convertFromZar, type CurrencyCode } from "@/lib/pricingConfig";
import type { FeePlan } from "@prisma/client";

// Mirrors base44/shared/subscriptionPlans.ts's getTierPrice — except the
// tier config itself already lives in this rebuild's FeePlan table
// (seeded by scripts/seed-fee-plans.mjs with the real published rates),
// not a second static table that could drift out of sync. One
// installment = FeePlan.monthlyFee x FeePlan.termMonths in ZAR (R200,
// R1200, R2400 for Soundcheck/Mainstage/Headliner), converted via
// pricingConfig.ts's ZAR_RATES — which were themselves reverse-engineered
// from Base44's exact SUBSCRIPTION_PRICES table, so results match exactly.
export function installmentAmountZar(feePlan: Pick<FeePlan, "monthlyFee" | "termMonths">): number {
  return Number(feePlan.monthlyFee) * feePlan.termMonths;
}

export function installmentAmount(feePlan: Pick<FeePlan, "monthlyFee" | "termMonths">, currency: CurrencyCode): number {
  return convertFromZar(installmentAmountZar(feePlan), currency);
}

// Kyshi collects these three (of the MusicianCountry enum's values);
// XOF-currency countries (Côte d'Ivoire, Senegal) aren't representable in
// this schema's MusicianCountry enum, unlike Base44's broader
// COUNTRY_CURRENCY map — everyone else falls back to Payfast/ZAR.
const KYSHI_COUNTRY_CURRENCY: Partial<Record<string, CurrencyCode>> = {
  NIGERIA: "NGN",
  KENYA: "KES",
  GHANA: "GHS",
};

export function resolveSubscriptionGateway(country: string | null | undefined): { currency: CurrencyCode; usesKyshi: boolean } {
  const kyshiCurrency = country ? KYSHI_COUNTRY_CURRENCY[country] : undefined;
  return kyshiCurrency ? { currency: kyshiCurrency, usesKyshi: true } : { currency: "ZAR", usesKyshi: false };
}

// SubscriptionPayment.tier is the uppercase SubscriptionTier enum; FeePlan
// is looked up by its Title Case name. One small map instead of a second
// query/inference path every caller reinvents.
export const TIER_TO_FEEPLAN_NAME: Record<string, "Soundcheck" | "Mainstage" | "Headliner"> = {
  SOUNDCHECK: "Soundcheck",
  MAINSTAGE: "Mainstage",
  HEADLINER: "Headliner",
};

// How many days before nextBillingDate a musician may pay early (matches
// base44/shared/subscriptionPlans.ts's REMINDER_DAYS_BEFORE — paying
// "early" within this window is really just paying on time).
export const SUBSCRIPTION_REMINDER_DAYS_BEFORE = 7;

// Grace period after a missed due date before access should lapse (mirrors
// GRACE_DAYS in the same source file). Not enforced anywhere yet in this
// rebuild (no lapse-sweep cron exists) — kept here so the constant has one
// home when that's built, rather than a second copy invented later.
export const SUBSCRIPTION_GRACE_DAYS = 7;
