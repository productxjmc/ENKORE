import { z } from "zod";

export const payfastInitializeSchema = z.object({
  trackId: z.string().min(1),
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  amount: z.number().positive(),
});
