import { z } from "zod";

const KYSHI_CURRENCIES = ["NGN", "KES", "GHS", "XOF"] as const;

export const kyshiInitializeSchema = z.object({
  trackId: z.string().min(1),
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  amount: z.number().positive(),
  localCurrency: z.enum(KYSHI_CURRENCIES).optional(),
});
