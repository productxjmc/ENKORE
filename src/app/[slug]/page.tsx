import Link from "next/link";
import { Music } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import { Storefront, type PlainMusician, type PlainTrack } from "./Storefront";

// Public musician storefront at the top-level slug — enkoremusic.africa/{slug}
// per the PRD (§5, "Musician Storefront"), not a /musician/{slug} or /m/{slug}
// prefix. Ported from src/pages/MusicianStorefront.jsx, deliberately scoped
// down to what's real today: profile + track catalogue + a working currency
// selector. Merch, bookings, the fan wall, and checkout all depend on
// stages that don't exist yet (5, 6, 4, 9) — rather than fake them, those
// tabs say so plainly. See StorefrontTabs for where they'll plug back in.
export default async function MusicianStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const musician = await withCurrentUser((tx) => tx.musician.findUnique({ where: { storefrontUrl: slug } }));

  if (!musician) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 text-lg mb-4">Musician not found</p>
          <Link href="/" className="text-orange-600 hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const tracks = await withCurrentUser((tx) =>
    tx.track.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } }),
  );

  return <Storefront musician={toPlain<PlainMusician>(musician)} tracks={toPlain<PlainTrack[]>(tracks)} />;
}
