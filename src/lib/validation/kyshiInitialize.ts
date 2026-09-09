import { z } from "zod";

const KYSHI_CURRENCIES = ["NGN", "KES", "GHS", "XOF"] as const;

// The only three categories Kyshi's own API documents (confirmed via
// docs.kyshi.co: `channels: ["card"]` narrows to a single channel) — no
// evidence anywhere that individual mobile-money networks (MTN MoMo,
// Airtel Money, M-Pesa) are separately selectable channel values, so the
// mobile app's rail picker offers these three, not per-network options.
export const KYSHI_CHANNELS = ["card", "mobileMoney", "bankTransfer"] as const;
export type KyshiChannel = (typeof KYSHI_CHANNELS)[number];

export const kyshiInitializeSchema = z.object({
  trackId: z.string().min(1),
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  amount: z.number().positive(),
  localCurrency: z.enum(KYSHI_CURRENCIES).optional(),
  // Optional — omitting it preserves the existing web storefront's
  // behavior exactly (all three channels offered on Kyshi's own page).
  channel: z.enum(KYSHI_CHANNELS).optional(),
});
