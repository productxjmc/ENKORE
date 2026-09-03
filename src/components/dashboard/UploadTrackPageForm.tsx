"use client";

import { useRouter } from "next/navigation";
import TrackUploadForm from "@/components/dashboard/TrackUploadForm";

// Thin client wrapper so /dashboard/upload-track/page.tsx can stay a
// server component — TrackUploadForm itself is generic (used both here
// and inline in TrackManagement.tsx), the redirect-on-success behavior
// is specific to this full-page context.
export default function UploadTrackPageForm({ musicianId }: { musicianId: string }) {
  const router = useRouter();
  return (
    <TrackUploadForm
      musicianId={musicianId}
      onSuccess={() => {
        router.push("/dashboard");
      }}
    />
  );
}
