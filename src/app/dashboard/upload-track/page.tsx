import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import UploadTrackPageForm from "@/components/dashboard/UploadTrackPageForm";

// Ported from the Base44 app's src/pages/UploadTrack.jsx — the dedicated
// full-page, fully-expanded version of TrackUploadForm (see
// TrackManagement.tsx for the inline/compact rendering on the dashboard
// itself).
export default async function UploadTrackPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const musician = await withCurrentUser((tx) =>
    tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } }),
  );
  if (!musician) redirect("/musician-pre-register");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Upload a Track</h1>
        <p className="text-sm text-gray-500 mb-6">Add a new track to your storefront.</p>
        <UploadTrackPageForm musicianId={musician.id} />
      </main>
    </div>
  );
}
