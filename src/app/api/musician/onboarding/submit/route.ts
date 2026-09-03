import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Ported from base44/functions/submitRequirements/entry.ts — moves a
// musician's onboarding to PENDING_REVIEW. requirementsStatus stays
// something only this route (or an admin) ever sets, never a direct
// client update, exactly like the source's own reasoning: otherwise a
// musician could set "approved" on themselves and skip review. Runs
// under withCurrentUser, not withServiceRole — musician_write RLS already
// lets an owner update their own row; this route's own logic is what
// enforces the required-docs gate, not a privilege escalation.
const REQUIRED_DOCS: Array<[string, string]> = [
  ["idDocumentUrl", "ID document"],
  ["bankConfirmationUrl", "Bank confirmation letter"],
  ["pressPhotoUrl", "Press photo"],
  ["artistBio", "Artist bio"],
];

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const submittedDocs = (body?.onboardingDocs ?? {}) as Record<string, string | undefined>;

  type Result =
    | { status: 404; error: string }
    | { status: 409; error: string }
    | { status: 422; error: string; missing: string[] }
    | { status: 200; alreadySubmitted?: boolean };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    // Idempotent: a double-submit shouldn't re-trigger review.
    if (musician.requirementsStatus === "PENDING_REVIEW") {
      return { status: 200, alreadySubmitted: true };
    }
    if (musician.requirementsStatus === "APPROVED" && user.role !== "ADMIN") {
      return { status: 409, error: "Your requirements are already approved." };
    }

    // Merge submitted docs over anything already saved by the draft-save route.
    const existingDocs = (musician.onboardingDocs as Record<string, string | undefined> | null) ?? {};
    const docs = { ...existingDocs, ...submittedDocs };

    const missing = REQUIRED_DOCS.filter(([key]) => !docs[key] || String(docs[key]).trim() === "").map(([, label]) => label);
    if (missing.length > 0) {
      return { status: 422, error: "Some required items are still missing.", missing };
    }

    const existingSocial = (musician.socialLinks as Record<string, string> | null) ?? {};
    const socialLinks = {
      ...existingSocial,
      ...(docs.socialInstagram ? { instagram: docs.socialInstagram } : {}),
      ...(docs.socialTwitter ? { twitter: docs.socialTwitter } : {}),
      ...(docs.socialFacebook ? { facebook: docs.socialFacebook } : {}),
    };

    const existingStreaming = (musician.streamingLinks as Record<string, string> | null) ?? {};
    const streamingLinks = {
      ...existingStreaming,
      ...(docs.streamingSpotify ? { spotify: docs.streamingSpotify } : {}),
      ...(docs.streamingApple ? { apple_music: docs.streamingApple } : {}),
      ...(docs.streamingYoutube ? { youtube_music: docs.streamingYoutube } : {}),
    };

    await tx.musician.update({
      where: { id: musician.id },
      data: {
        onboardingDocs: docs,
        onboardingStep: "DOCS_SUBMITTED",
        bio: docs.artistBio || musician.bio,
        requirementsStatus: "PENDING_REVIEW",
        requirementsSubmittedAt: new Date(),
        socialLinks,
        streamingLinks,
      },
    });

    return { status: 200 };
  });

  if (result.status !== 200) {
    return NextResponse.json(
      { error: result.error, ...("missing" in result ? { missing: result.missing } : {}) },
      { status: result.status },
    );
  }
  return NextResponse.json({ success: true, alreadySubmitted: result.alreadySubmitted ?? false });
}
