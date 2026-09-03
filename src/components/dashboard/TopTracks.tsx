import { Music } from "lucide-react";
import type { PlainTrack } from "@/components/dashboard/MusicianDashboardShell";

// Ported from the Base44 app's src/components/dashboard/TopTracks.jsx.
export default function TopTracks({ tracks }: { tracks: PlainTrack[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Top Tracks</h3>
      {tracks.length === 0 ? (
        <p className="text-sm text-gray-400">Upload your first track to start selling music.</p>
      ) : (
        <div className="space-y-3">
          {tracks.map((track) => (
            <div key={track.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                {track.coverArt ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={track.coverArt} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Music className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{track.title}</p>
                <p className="text-xs text-gray-500">{track.genre || "Uncategorized"}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900">R{track.revenueGenerated.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{track.downloadsCount} downloads</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
