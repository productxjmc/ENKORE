import Link from "next/link";
import { Ticket, Disc3, ArrowRight } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { toPlain } from "@/lib/serialize";

// Real content per Phase 2 — the scripture band is unchanged from Phase 0
// (it was already final then). "Musicians near you" prioritizes the
// signed-in fan's own city (Fan.location) when known, then falls back to
// the most recently live storefronts — there's no lat/lng on Musician to
// do real geo-distance with, so this is city-string matching, not a map.
export default async function MobileHomePage() {
  const fan = await getCurrentFan();
  const city = fan?.location ?? null;

  const [nextEvent, latestTrack, musicians] = await withCurrentUser(async (tx) => {
    const eventP = tx.event.findFirst({
      where: { status: "UPCOMING" },
      orderBy: { eventDate: "asc" },
      include: { musician: { select: { musicianName: true } } },
    });
    const trackP = tx.track.findFirst({
      where: { musician: { isLive: true } },
      orderBy: { createdAt: "desc" },
      include: { musician: { select: { musicianName: true } } },
    });
    const nearP = city
      ? tx.musician.findMany({ where: { isLive: true, location: { contains: city, mode: "insensitive" } }, take: 6 })
      : Promise.resolve([]);
    const musiciansP = (async () => {
      const near = await nearP;
      if (near.length >= 4) return near;
      const rest = await tx.musician.findMany({
        where: { isLive: true, id: { notIn: near.map((m) => m.id) } },
        orderBy: { createdAt: "desc" },
        take: 6 - near.length,
      });
      return [...near, ...rest];
    })();
    return Promise.all([eventP, trackP, musiciansP]);
  });

  return (
    <div>
      <div className="px-4 pb-[22px] pt-5 text-white" style={{ background: "var(--m-ink)" }}>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--m-accent)" }}>
          1 Corinthians 10:31
        </p>
        <p className="mt-2 text-[15px] leading-[1.45]" style={{ color: "rgba(243,242,242,.86)" }}>
          So whether you eat or drink or whatever you do, do it all for the glory of God.
        </p>
        <p className="mt-[18px] text-[30px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">
          Built for Christian musicians. Built for His glory.
        </p>
      </div>

      {(nextEvent || latestTrack) && (
        <div className="border-b-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
            Today
          </p>
          <div className="grid grid-cols-2 gap-[2px]" style={{ background: "var(--m-line)" }}>
            {nextEvent ? (
              <Link href={`/m/event/${nextEvent.id}`} className="flex min-h-[88px] flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
                <Ticket className="h-5 w-5" style={{ color: "var(--m-accent)" }} />
                <span className="text-[13px] font-bold leading-tight">{nextEvent.title}</span>
                <span className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>{nextEvent.musician.musicianName}</span>
              </Link>
            ) : (
              <div />
            )}
            {latestTrack ? (
              <Link href={`/m/u/${latestTrack.musicianId}`} className="flex min-h-[88px] flex-col gap-2 p-3" style={{ background: "var(--m-ground)" }}>
                <Disc3 className="h-5 w-5" style={{ color: "var(--m-accent)" }} />
                <span className="text-[13px] font-bold leading-tight">New release</span>
                <span className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>
                  {latestTrack.musician.musicianName} · {latestTrack.title}
                </span>
              </Link>
            ) : (
              <div />
            )}
          </div>
        </div>
      )}

      {musicians.length > 0 && (
        <div className="border-b-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Musicians near you</h2>
            {city && <span className="text-[11px] font-semibold" style={{ color: "var(--m-accent)" }}>{city}</span>}
          </div>
          <div className="flex flex-col">
            {toPlain<{ id: string; storefrontUrl: string | null; musicianName: string; profileImage: string | null; location: string | null }[]>(musicians).map((m) => (
              <Link
                key={m.id}
                href={`/m/u/${m.storefrontUrl ?? m.id}`}
                className="flex min-h-16 items-center gap-3 border-t py-3"
                style={{ borderColor: "var(--m-hairline)" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
                <img src={m.profileImage || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop"} alt="" className="h-14 w-14 flex-none grayscale" style={{ objectFit: "cover" }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{m.musicianName}</span>
                  <span className="block truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{m.location ?? "Africa"}</span>
                </span>
                <ArrowRight className="h-[18px] w-[18px]" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {musicians.length === 0 && !nextEvent && !latestTrack && (
        <p className="p-4 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
          No live storefronts yet — check back soon.
        </p>
      )}
    </div>
  );
}
