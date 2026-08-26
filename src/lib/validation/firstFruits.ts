import { z } from "zod";

// Mirrors the 3 questions in "ENKORE Connect — First Fruits Application
// Copy" plus the email address the acceptance flow needs (implied by that
// doc, not one of the numbered questions). Shared between the API route
// and the client form so client-side and server-side validation can't
// silently drift apart.
export const firstFruitsApplicationSchema = z.object({
  email: z.email("Enter a valid email address"),
  artistName: z.string().trim().min(1, "Tell us your artist/stage name"),
  location: z.string().trim().max(200).optional(),
  songLink: z.string().trim().min(1, "Drop a link to one song"),
  fanReachAnswer: z.string().trim().min(1, "This one's the important one — be honest"),
});

export type FirstFruitsApplicationInput = z.infer<typeof firstFruitsApplicationSchema>;
