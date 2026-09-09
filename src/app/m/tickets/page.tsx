import Link from "next/link";
import { Ticket } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { toPlain } from "@/lib/serialize";
import TicketQR from "@/components/mobile/TicketQR";

export default async function MobileTicketsPage() {
  const fan = await getCurrentFan();
  if (!fan) {
    return (
      <div className="p-4">
        <h1 className="text-[22px] font-extrabold uppercase tracking-[-0.02em]">Tickets</h1>
        <p className="mt-4 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
          Sign in to see your tickets.
        </p>
      </div>
    );
  }

  const tickets = await withCurrentUser((tx) =>
    tx.ticketPurchase.findMany({
      where: { fanId: fan.id, status: "CONFIRMED" },
      include: { event: { include: { musician: { select: { musicianName: true } } } } },
      orderBy: { event: { eventDate: "asc" } },
    }),
  );

  return (
    <div className="p-4">
      <h1 className="text-[22px] font-extrabold uppercase tracking-[-0.02em]">Tickets</h1>
      <div className="mt-4 flex flex-col gap-3">
        {toPlain<{ id: string; quantity: number; ticketCode: string | null; event: { id: string; title: string; venue: string; eventDate: string; musician: { musicianName: string } } }[]>(tickets).map((t) => (
          <div key={t.id} className="flex flex-col gap-3 border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[15px] font-extrabold">{t.event.title}</p>
                <p className="mt-1 text-[12px]" style={{ color: "var(--m-text-muted)" }}>{t.event.musician.musicianName} · {t.event.venue}</p>
                <p className="mt-0.5 text-[11px]" style={{ color: "var(--m-text-faint)" }}>
                  {new Date(t.event.eventDate).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })} · {t.quantity} {t.quantity === 1 ? "ticket" : "tickets"}
                </p>
              </div>
              <Link href={`/m/event/${t.event.id}`} className="flex-none text-[11px] font-bold" style={{ color: "var(--m-accent)" }}>
                Details
              </Link>
            </div>
            {t.ticketCode && <TicketQR code={t.ticketCode} />}
          </div>
        ))}
        {tickets.length === 0 && (
          <div className="flex flex-col items-center py-12 text-center">
            <Ticket className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
            <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No tickets yet.</p>
            <Link href="/m" className="mt-3 text-[12px] font-bold" style={{ color: "var(--m-accent)" }}>
              See what&apos;s on
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
