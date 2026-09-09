import { z } from "zod";
import { KYSHI_CHANNELS } from "./kyshiInitialize";

export const ticketInitializeSchema = z.object({
  eventId: z.string().min(1),
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  quantity: z.number().int().min(1).max(20),
  // Ignored by the Payfast route — only Kyshi's channels array can
  // actually be narrowed to one value, same as the track-purchase route.
  channel: z.enum(KYSHI_CHANNELS).optional(),
});
