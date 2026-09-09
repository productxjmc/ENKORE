import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import { formatFromZar } from "@/lib/pricingConfig";

// Same public-read data the web storefront (src/app/[slug]/page.tsx)
// already queries — Musician/Track/Merchandise/Event are all public-select
// by RLS design (storefronts are public pages). Looked up by storefrontUrl
// first, falling back to id, since Home's "musicians near you" links use
// storefrontUrl when set and id otherwise (not every musician has claimed
// a storefront slug).
export default async function MobileStorefrontPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const musician = await withCurrentUser((tx) =>
    tx.musician.findFirst({ where: { OR: [{ storefrontUrl: slug }, { id: slug }] } }),
  );
  if (!musician) notFound();

  const [tracks, events] = await withCurrentUser((tx) =>
    Promise.all([
      tx.track.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } }),
      tx.event.findMany({ where: { musicianId: musician.id, status: { in: ["UPCOMING", "SOLD_OUT"] } }, orderBy: { eventDate: "asc" } }),
    ]),
  );

  return (
    <div>
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
        <img
          src={musician.profileImage || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&h=900&fit=crop"}
          alt=""
          className="block h-[220px] w-full grayscale"
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-x-0 bottom-0 px-4 pb-4 pt-6 text-white" style={{ background: "linear-gradient(to top, rgba(32,30,29,.94), rgba(32,30,29,0))" }}>
          {musician.location && (
            <p className="m-0 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
              <MapPin className="h-3 w-3" /> {musician.location}
            </p>
          )}
          <h1 className="mt-1.5 text-[26px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">{musician.musicianName}</h1>
        </div>
      </div>

      {musician.bio && (
        <p className="border-b p-4 text-[13px] leading-[1.5]" style={{ borderColor: "var(--m-hairline)", color: "var(--m-text-muted)" }}>
          {musician.bio}
        </p>
      )}

      {events.length > 0 && (
        <div className="border-b-2 p-4" style={{ borderColor: "var(--m-line)" }}>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
            Upcoming
          </p>
          {toPlain<{ id: string; title: string; venue: string; eventDate: string; ticketPrice: number }[]>(events).map((e) => (
            <Link key={e.id} href={`/m/event/${e.id}`} className="block border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
              <p className="text-[15px] font-extrabold">{e.title}</p>
              <p className="mt-0.5 text-[12px]" style={{ color: "var(--m-text-muted)" }}>{e.venue}</p>
              <p className="mt-1 text-[13px] font-bold" style={{ color: "var(--m-accent)" }}>{formatFromZar(e.ticketPrice, "ZAR")}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>
          Music
        </p>
        {tracks.length === 0 ? (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>No tracks yet.</p>
        ) : (
          toPlain<{ id: string; title: string; genre: string | null; coverArt: string | null; basePrice: number | null; minimumPrice: number; payWhatYouWant: boolean; downloadsCount: number }[]>(tracks).map((t) => (
            <Link key={t.id} href={`/m/track/${t.id}/buy`} className="flex min-h-[72px] items-center gap-3 border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
              <img src={t.coverArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"} alt="" className="h-14 w-14 flex-none grayscale" style={{ objectFit: "cover" }} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-bold">{t.title}</span>
                <span className="block truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{t.genre ?? "Gospel"} · {t.downloadsCount} downloads</span>
              </span>
              <span className="text-right">
                <span className="block text-[15px] font-extrabold" style={{ color: "var(--m-accent)" }}>
                  {t.payWhatYouWant ? `${formatFromZar(t.minimumPrice, "ZAR")}+` : formatFromZar(t.basePrice ?? t.minimumPrice, "ZAR")}
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
