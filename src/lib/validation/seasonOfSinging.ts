import { z } from "zod";
import type { ChristianGenre } from "@prisma/client";
import { CHRISTIAN_GENRE_OPTIONS } from "@/lib/validation/musicianPreRegistration";

const christianGenreValues = CHRISTIAN_GENRE_OPTIONS.map((o) => o.value) as [ChristianGenre, ...ChristianGenre[]];

export const HOW_HEARD_OPTIONS = [
  { label: "TikTok video", value: "TIKTOK_VIDEO" },
  { label: "TikTok ad", value: "TIKTOK_AD" },
  { label: "DJ Garth", value: "DJ_GARTH" },
  { label: "DJ Sebz", value: "DJ_SEBZ" },
  { label: "Sparky", value: "SPARKY" },
  { label: "Other", value: "OTHER" },
] as const;

// Field list and both consent checkboxes match the Season of Singing term
// sheet's "Ready-to-build field list" exactly. Both consents are required
// (not just displayed) — this is a real program with real terms, not a
// lead-gen form, so agreement is captured at submission.
export const seasonOfSingingApplicationSchema = z.object({
  artistName: z.string().trim().min(1, "Required"),
  location: z.string().trim().max(200).optional(),
  songLink: z.string().trim().min(1, "Required"),
  christianGenre: z.enum(christianGenreValues).optional(),
  email: z.email("Enter a valid email address"),
  phoneNumber: z.string().trim().min(1, "Required"),
  bio: z.string().trim().max(1000).optional(),
  howHeard: z.string().trim().max(100).optional(),
  agreedToTerms: z.boolean().refine((v) => v === true, "Required"),
  agreedToLaunchTerms: z.boolean().refine((v) => v === true, "Required"),
});

export type SeasonOfSingingApplicationInput = z.infer<typeof seasonOfSingingApplicationSchema>;
