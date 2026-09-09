import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

export default async function MobileMusiciansPage() {
  const musicians = await withCurrentUser((tx) =>
    tx.musician.findMany({ where: { isLive: true }, orderBy: { musicianName: "asc" } }),
  );

  return (
    <div className="p-4">
      <h1 className="text-[22px] font-extrabold uppercase tracking-[-0.02em]">Musicians</h1>
      <div className="mt-4 flex flex-col">
        {toPlain<{ id: string; storefrontUrl: string | null; musicianName: string; profileImage: string | null; location: string | null }[]>(musicians).map((m) => (
          <Link key={m.id} href={`/m/u/${m.storefrontUrl ?? m.id}`} className="flex min-h-16 items-center gap-3 border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
            <img src={m.profileImage || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&h=200&fit=crop"} alt="" className="h-14 w-14 flex-none grayscale" style={{ objectFit: "cover" }} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold">{m.musicianName}</span>
              <span className="block truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{m.location ?? "Africa"}</span>
            </span>
            <ArrowRight className="h-[18px] w-[18px]" />
          </Link>
        ))}
        {musicians.length === 0 && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>No live storefronts yet.</p>
        )}
      </div>
    </div>
  );
}
