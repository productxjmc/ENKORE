import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import { Storefront, type PlainMusician, type PlainTrack, type PlainMerchandise, type PlainEvent } from "./Storefront";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkoremusic.online";

// cache() dedupes this between generateMetadata and the page body —
// both run for the same request, and without it Next calls this twice
// (it doesn't dedupe arbitrary async functions the way it dedupes
// fetch()).
const getMusicianBySlug = cache((slug: string) => withCurrentUser((tx) => tx.musician.findUnique({ where: { storefrontUrl: slug } })));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const musician = await getMusicianBySlug(slug);
  if (!musician) return {};

  const title = `${musician.musicianName} | ENKORE`;
  const description = musician.bio?.trim()
    ? musician.bio.slice(0, 200)
    : `Buy music, merch and tickets from ${musician.musicianName} on ENKORE.`;
  const url = `${SITE_URL}/${slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "profile",
      images: musician.profileImage ? [{ url: musician.profileImage }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: musician.profileImage ? [musician.profileImage] : undefined,
    },
  };
}

// Public musician storefront at the top-level slug — enkoremusic.africa/{slug}
// per the PRD (§5, "Musician Storefront"), not a /musician/{slug} or /m/{slug}
// prefix. Ported from src/pages/MusicianStorefront.jsx, scoped to what's
// real: profile + track catalogue + a working currency selector, and now
// (Phase 9) merchandise — ACTIVE items only, ordered via the no-online-
// payment request flow (see MerchOrder in Storefront.tsx). Bookings and
// the fan wall still depend on stages that don't exist yet — rather than
// fake them, those tabs say so plainly.
export default async function MusicianStorefrontPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab } = await searchParams;

  const musician = await getMusicianBySlug(slug);

  if (!musician) notFound();

  const [tracks, merchandise, events] = await Promise.all([
    withCurrentUser((tx) => tx.track.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } })),
    withCurrentUser((tx) => tx.merchandise.findMany({ where: { musicianId: musician.id, status: "ACTIVE" }, orderBy: { createdAt: "desc" } })),
    withCurrentUser((tx) => tx.event.findMany({ where: { musicianId: musician.id, status: { in: ["UPCOMING", "SOLD_OUT"] } }, orderBy: { eventDate: "asc" } })),
  ]);

  return (
    <Storefront
      musician={toPlain<PlainMusician>(musician)}
      tracks={toPlain<PlainTrack[]>(tracks)}
      merchandise={toPlain<PlainMerchandise[]>(merchandise)}
      events={toPlain<PlainEvent[]>(events)}
      initialTab={tab}
    />
  );
}
