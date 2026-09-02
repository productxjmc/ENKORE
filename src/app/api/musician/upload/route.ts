import { NextResponse, type NextRequest } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Server-side half of the musician upload flow. Every upload in the
// musician dashboard (track audio/cover art, profile image, onboarding
// docs) goes through @vercel/blob's CLIENT upload pattern, not a
// server-proxied route — Vercel's serverless functions cap request bodies
// at ~4.5MB, well under the 50MB this app needs for audio files. Bytes go
// browser -> Blob directly; this route's only job is minting a short-lived,
// scoped upload token after verifying the caller actually owns the
// musicianId they're uploading into.
export type UploadKind = "track_audio" | "track_cover" | "profile_image" | "id_document" | "bank_confirmation" | "press_photo";

const UPLOAD_LIMITS: Record<UploadKind, { contentTypes: string[]; maxBytes: number }> = {
  track_audio: { contentTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav"], maxBytes: 50 * 1024 * 1024 },
  track_cover: { contentTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  profile_image: { contentTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
  id_document: { contentTypes: ["image/jpeg", "image/png", "application/pdf"], maxBytes: 10 * 1024 * 1024 },
  bank_confirmation: { contentTypes: ["image/jpeg", "image/png", "application/pdf"], maxBytes: 10 * 1024 * 1024 },
  press_photo: { contentTypes: ["image/jpeg", "image/png", "image/webp"], maxBytes: 5 * 1024 * 1024 },
};

export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "File uploads are not configured in this environment yet" }, { status: 503 });
  }

  const body = (await req.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (_pathname, clientPayloadRaw) => {
        const user = await getCurrentAppUser();
        if (!user) throw new Error("Unauthorized");

        let payload: { kind?: UploadKind; musicianId?: string } = {};
        try {
          payload = clientPayloadRaw ? JSON.parse(clientPayloadRaw) : {};
        } catch {
          throw new Error("Invalid upload payload");
        }
        const { kind, musicianId } = payload;
        if (!kind || !musicianId || !UPLOAD_LIMITS[kind]) {
          throw new Error("Invalid upload kind");
        }

        // Ownership check — the caller must own the musicianId they're
        // uploading into (or be an admin). Same identity resolution
        // page.tsx server components already use.
        if (user.role !== "ADMIN") {
          const owns = await withCurrentUser((tx) =>
            tx.musician.findFirst({ where: { id: musicianId, OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true } }),
          );
          if (!owns) throw new Error("Forbidden");
        }

        const { contentTypes, maxBytes } = UPLOAD_LIMITS[kind];
        return {
          allowedContentTypes: contentTypes,
          maximumSizeInBytes: maxBytes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ kind, musicianId, userId: user.id }),
        };
      },
      // No onUploadCompleted: Vercel's completion callback requires a
      // publicly-reachable URL and never fires against localhost in dev,
      // so any side effect that must work locally can't depend on it. The
      // client already gets the final blob URL back synchronously from
      // upload() and is responsible for persisting it (e.g. the onboarding
      // wizard's press-photo step calls the save route with the URL
      // directly) — same shape as Base44's own UploadFile-then-update
      // pattern, just without a webhook in between.
    });

    return NextResponse.json(jsonResponse);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    const status = message === "Unauthorized" ? 401 : message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
