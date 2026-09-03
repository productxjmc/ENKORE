import { z } from "zod";

export const ticketInitializeSchema = z.object({
  eventId: z.string().min(1),
  musicianId: z.string().min(1),
  fanEmail: z.email(),
  fanName: z.string().trim().max(200).optional(),
  quantity: z.number().int().min(1).max(20),
});
