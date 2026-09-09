import Link from "next/link";
import { Disc3 } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { toPlain } from "@/lib/serialize";

// Purchase rows are matched to the signed-in fan by email (fanId only gets
// set for gateway-attributed purchases today, per the same pattern the web
// storefront's TrackCheckout / Purchase creation uses — Purchase.fanEmail
// is always set, Purchase.fanId is optional).
export default async function MobileLibraryPage() {
  const fan = await getCurrentFan();
  if (!fan) {
    return (
      <div className="p-4">
        <h1 className="text-[22px] font-extrabold uppercase tracking-[-0.02em]">Library</h1>
        <p className="mt-4 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
          Sign in to see the tracks you&apos;ve bought.
        </p>
      </div>
    );
  }

  const purchases = await withCurrentUser((tx) =>
    tx.purchase.findMany({
      where: { fanEmail: fan.email, status: "COMPLETED" },
      include: { track: true, musician: { select: { musicianName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  );

  return (
    <div className="p-4">
      <h1 className="text-[22px] font-extrabold uppercase tracking-[-0.02em]">Library</h1>
      <div className="mt-4 flex flex-col">
        {toPlain<{ id: string; track: { id: string; title: string; genre: string | null; coverArt: string | null; audioFileUrl: string }; musician: { musicianName: string } }[]>(purchases).map((p) => (
          <div key={p.id} className="flex min-h-16 items-center gap-3 border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
            <img src={p.track.coverArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop"} alt="" className="h-14 w-14 flex-none grayscale" style={{ objectFit: "cover" }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{p.track.title}</span>
              <span className="block truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{p.musician.musicianName} · {p.track.genre ?? "Gospel"}</span>
            </span>
            <a href={p.track.audioFileUrl} download className="flex min-h-11 items-center px-3 text-[11px] font-bold" style={{ color: "var(--m-accent)" }}>
              Download
            </a>
          </div>
        ))}
        {purchases.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Disc3 className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>Nothing here yet.</p>
            <Link href="/m/musicians" className="mt-3 text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>
              Browse musicians
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
