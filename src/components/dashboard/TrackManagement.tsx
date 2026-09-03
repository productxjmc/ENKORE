"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Music, Plus, ExternalLink } from "lucide-react";
import TrackUploadForm from "@/components/dashboard/TrackUploadForm";
import type { PlainTrack } from "@/components/dashboard/MusicianDashboardShell";

// Ported from the Base44 app's src/components/dashboard/TrackManagement.jsx
// + InlineUploadPanel.jsx, consolidated — the upload button toggles
// TrackUploadForm inline rather than always navigating to the full-page
// /dashboard/upload-track route (that page still exists for a dedicated,
// fully-expanded version of the same form).
export default function TrackManagement({ tracks, musicianId }: { tracks: PlainTrack[]; musicianId: string }) {
  const router = useRouter();
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Your Tracks ({tracks.length})</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowUpload((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full px-4 py-2 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> {showUpload ? "Cancel" : "Upload Track"}
          </button>
          <Link href="/dashboard/upload-track" className="text-xs text-gray-400 hover:text-gray-600 underline">
            Full form
          </Link>
        </div>
      </div>

      {showUpload && (
        <div className="mb-5 pb-5 border-b border-gray-100">
          <TrackUploadForm
            musicianId={musicianId}
            compact
            onSuccess={() => {
              setShowUpload(false);
              router.refresh();
            }}
          />
        </div>
      )}

      {tracks.length === 0 ? (
        <p className="text-sm text-gray-400">No tracks yet. Upload your first track to start selling music.</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {track.coverArt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{track.title}</p>
                <p className="text-xs text-gray-500">
                  {track.genre || "Uncategorized"} · {track.downloadsCount} downloads
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">R{track.revenueGenerated.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{track.payWhatYouWant ? "Pay what you want" : `R${(track.basePrice ?? 0).toLocaleString()}`}</p>
              </div>
              {track.previewUrl && (
                <a href={track.previewUrl} target="_blank" rel="noopener noreferrer" className="text-gray-300 hover:text-gray-500 shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
