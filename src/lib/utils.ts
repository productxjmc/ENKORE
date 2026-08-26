import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Ported from the Base44 app's src/lib/utils.js — same currency set, same
// two-decimal formatting.
const CURRENCY_FORMATS: Record<string, string> = {
  ZAR: "R",
  USD: "US$",
  NGN: "₦",
  KES: "KSh",
  GHS: "GH₵",
  XOF: "CFA ",
};

export function formatCurrency(amount: number | string, currencyCode = "ZAR") {
  const prefix = CURRENCY_FORMATS[currencyCode] ?? CURRENCY_FORMATS.ZAR;
  const value = Number(amount || 0).toFixed(2);
  return `${prefix}${value}`;
}
