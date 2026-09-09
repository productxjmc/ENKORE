import { notFound } from "next/navigation";
import { MapPin, Calendar } from "lucide-react";
import { withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { toPlain } from "@/lib/serialize";
import EventBuyFlow from "@/components/mobile/EventBuyFlow";

export default async function MobileEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const event = await withCurrentUser((tx) => tx.event.findUnique({ where: { id }, include: { musician: true } }));
  if (!event) notFound();

  const fan = await getCurrentFan();
  const remaining = event.totalTickets - event.ticketsSold;

  return (
    <div>
      {event.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs
        <img src={event.coverImage} alt="" className="block h-[200px] w-full grayscale" style={{ objectFit: "cover" }} />
      )}

      <div className="p-4">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          {event.musician.musicianName}
        </p>
        <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">{event.title}</h1>

        <div className="mt-3 flex flex-col gap-1.5 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-none" />
            {new Date(event.eventDate).toLocaleString("en-ZA", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-none" /> {event.venue}
          </span>
        </div>

        {event.description && (
          <p className="mt-4 text-[13px] leading-[1.5]" style={{ color: "var(--m-text-muted)" }}>{event.description}</p>
        )}

        <div className="mt-6 border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
          {event.status === "CANCELLED" ? (
            <p className="text-[13px] font-bold" style={{ color: "var(--m-accent)" }}>This event has been cancelled.</p>
          ) : event.status === "SOLD_OUT" || remaining <= 0 ? (
            <p className="text-[13px] font-bold" style={{ color: "var(--m-accent)" }}>Sold out.</p>
          ) : (
            <EventBuyFlow
              event={toPlain({ id: event.id, title: event.title, ticketPrice: event.ticketPrice, remaining })}
              musician={{ id: event.musician.id, musicianName: event.musician.musicianName, country: event.musician.country }}
              fanEmail={fan?.email ?? ""}
              fanName={fan?.fullName ?? ""}
            />
          )}
        </div>
      </div>
    </div>
  );
}
