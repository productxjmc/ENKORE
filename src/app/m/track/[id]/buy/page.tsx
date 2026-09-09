import { notFound } from "next/navigation";
import { withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { toPlain } from "@/lib/serialize";
import TrackBuyFlow from "@/components/mobile/TrackBuyFlow";

export default async function MobileTrackBuyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const track = await withCurrentUser((tx) => tx.track.findUnique({ where: { id }, include: { musician: true } }));
  if (!track) notFound();

  const fan = await getCurrentFan();

  return (
    <TrackBuyFlow
      track={toPlain({
        id: track.id,
        title: track.title,
        genre: track.genre,
        coverArt: track.coverArt,
        basePrice: track.basePrice,
        minimumPrice: track.minimumPrice,
        payWhatYouWant: track.payWhatYouWant,
      })}
      musician={{ id: track.musician.id, musicianName: track.musician.musicianName, country: track.musician.country }}
      fanEmail={fan?.email ?? ""}
      fanName={fan?.fullName ?? ""}
    />
  );
}
