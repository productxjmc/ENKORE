"use client";

import { upload } from "@vercel/blob/client";
import type { UploadKind } from "@/app/api/musician/upload/route";

// Thin wrapper around @vercel/blob/client's upload() — one place to change
// if Blob's client API shifts, and where every dashboard upload (track
// audio/cover, profile image, onboarding docs) gets its pathname/payload
// shape right consistently. Auth happens server-side in
// src/app/api/musician/upload/route.ts's onBeforeGenerateToken; this
// function just kicks off the direct-to-Blob upload and returns the URL.
export async function uploadFile(file: File, kind: UploadKind, musicianId: string): Promise<string> {
  const pathname = `musicians/${musicianId}/${kind}/${Date.now()}-${file.name}`;
  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/musician/upload",
    clientPayload: JSON.stringify({ kind, musicianId }),
  });
  return blob.url;
}
