import { z } from "zod";
import type { ChristianGenre } from "@prisma/client";

// Same 10 options as the Base44 app's GOSPEL_GENRES list, typed against
// the generated Prisma enum via a type-only import — `import type` is
// erased at build time, unlike a runtime import of "@prisma/client",
// which pulls in Node-only native bindings that broke the dev server the
// moment this file's client-imported (the musician-pre-register page
// imports CHRISTIAN_GENRE_OPTIONS for the <select> options). The literal
// strings below still get checked against the real enum by TypeScript.
export const CHRISTIAN_GENRE_OPTIONS: { label: string; value: ChristianGenre }[] = [
  { label: "Gospel", value: "GOSPEL" },
  { label: "Worship & Praise", value: "WORSHIP_AND_PRAISE" },
  { label: "Christian Hip-Hop", value: "CHRISTIAN_HIP_HOP" },
  { label: "Contemporary Christian", value: "CONTEMPORARY_CHRISTIAN" },
  { label: "Christian R&B", value: "CHRISTIAN_RNB" },
  { label: "Christian Rock", value: "CHRISTIAN_ROCK" },
  { label: "Hymns & Traditional", value: "HYMNS_AND_TRADITIONAL" },
  { label: "Christian Afrobeats", value: "CHRISTIAN_AFROBEATS" },
  { label: "Inspirational", value: "INSPIRATIONAL" },
  { label: "Other", value: "OTHER" },
];

const christianGenreValues = CHRISTIAN_GENRE_OPTIONS.map((o) => o.value) as [ChristianGenre, ...ChristianGenre[]];

// Mirrors the MusicianPreRegistration entity's `required` fields
// (artistName, email, phoneNumber). The old form's confirm_* fields are
// client-side double-entry checks only — never submitted, so they have no
// place here.
export const musicianPreRegistrationSchema = z.object({
  artistName: z.string().trim().min(1, "Required"),
  email: z.email("Enter a valid email address"),
  phoneNumber: z.string().trim().min(1, "Required"),
  location: z.string().trim().max(200).optional(),
  spotifyUrl: z.string().trim().max(500).optional(),
  bio: z.string().trim().max(2000).optional(),
  christianGenre: z.enum(christianGenreValues).optional(),
  referralCode: z.string().trim().max(100).optional(),
});

export type MusicianPreRegistrationInput = z.infer<typeof musicianPreRegistrationSchema>;
