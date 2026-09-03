import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import ShareStorefront from "@/components/storefront/ShareStorefront";
import StorefrontQRGenerator from "@/components/qr/StorefrontQRGenerator";
import EventQRCode from "@/components/qr/EventQRCode";
import LocationMap, { type LocationFollow } from "@/components/qr/LocationMap";

// Phase 12 — Storefront sharing / QR. A new dashboard page (the plan
// doesn't specify one; this follows the same pattern as
// /dashboard/merchandise and /dashboard/events) bundling all four ported
// components. Follows are fetched here rather than threaded through the
// main dashboard shell's DashboardData, since only this page needs them
// and every other /dashboard/* subpage already does its own scoped fetch
// (see merchandise/events pages) rather than sharing page.tsx's payload.
export default async function PromotePage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;

    const [tracks, merchandise, follows] = await Promise.all([
      tx.track.findMany({ where: { musicianId: musician.id }, select: { id: true, title: true, genre: true }, orderBy: { createdAt: "desc" } }),
      tx.merchandise.findMany({ where: { musicianId: musician.id }, select: { id: true, name: true, type: true }, orderBy: { createdAt: "desc" } }),
      tx.follow.findMany({ where: { musicianId: musician.id }, select: { location: true, source: true } }),
    ]);

    return { musician, tracks, merchandise, follows };
  });

  if (!data) redirect("/musician-pre-register");
  if (!data.musician.storefrontUrl) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6 md:space-y-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Promote</h1>
          <p className="text-sm text-gray-500 mt-1">Share your storefront and track where your fans are connecting from.</p>
        </div>

        <ShareStorefront storefrontUrl={data.musician.storefrontUrl} />
        <StorefrontQRGenerator storefrontUrl={data.musician.storefrontUrl} musicianName={data.musician.musicianName} tracks={data.tracks} merch={data.merchandise} />
        <EventQRCode musicianId={data.musician.id} musicianName={data.musician.musicianName} />
        <LocationMap follows={toPlain<LocationFollow[]>(data.follows)} />
      </main>
    </div>
  );
}
