import Link from "next/link";
import { redirect } from "next/navigation";
import { ScanLine } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

export default async function MobileCheckinEventsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    const events = await tx.event.findMany({ where: { musicianId: musician.id, status: { in: ["UPCOMING", "SOLD_OUT"] } }, orderBy: { eventDate: "asc" } });
    return { events };
  });

  if (!data) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Door check-in</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>Pick an event to start scanning tickets.</p>

      <div className="mt-5 flex flex-col">
        {data.events.map((e) => (
          <Link key={e.id} href={`/m/checkin/${e.id}`} className="flex min-h-16 items-center gap-3 border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
            <ScanLine className="h-5 w-5 flex-none" style={{ color: "var(--m-accent)" }} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-bold">{e.title}</p>
              <p className="text-[11px]" style={{ color: "var(--m-text-muted)" }}>{new Date(e.eventDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })} · {e.venue}</p>
            </div>
          </Link>
        ))}
        {data.events.length === 0 && (
          <p className="py-8 text-center text-[13px]" style={{ color: "var(--m-text-muted)" }}>No upcoming events.</p>
        )}
      </div>
    </div>
  );
}
