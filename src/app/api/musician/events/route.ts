import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

// Ported from the Base44 app's src/components/events/CreateEventForm.jsx
// + EventsList.jsx. event_write RLS already covers full owner CRUD. The
// source's EventsManagement.jsx had the same real multi-tenant bug as
// MerchandiseManagement.jsx (Musician.list()[0], unfiltered) — fixed
// here the same way as every other phase's version of this bug.
export async function GET() {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const events = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return [];
    return tx.event.findMany({ where: { musicianId: musician.id }, orderBy: { eventDate: "desc" } });
  });

  return NextResponse.json({ events: toPlain(events) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const venue = typeof body?.venue === "string" ? body.venue.trim() : "";
  const eventDate = typeof body?.eventDate === "string" ? new Date(body.eventDate) : null;
  const ticketPrice = Number(body?.ticketPrice);
  const totalTickets = Number.parseInt(String(body?.totalTickets), 10);

  if (!title) return NextResponse.json({ error: "Event title is required" }, { status: 400 });
  if (!venue) return NextResponse.json({ error: "Venue is required" }, { status: 400 });
  if (!eventDate || Number.isNaN(eventDate.getTime())) return NextResponse.json({ error: "A valid date & time is required" }, { status: 400 });
  if (!Number.isFinite(ticketPrice) || ticketPrice < 0) return NextResponse.json({ error: "Ticket price must be 0 or greater" }, { status: 400 });
  if (!Number.isInteger(totalTickets) || totalTickets < 1) return NextResponse.json({ error: "Total tickets must be at least 1" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; event: unknown };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    const event = await tx.event.create({
      data: {
        musicianId: musician.id,
        title,
        description: body?.description || undefined,
        venue,
        eventDate,
        ticketPrice,
        totalTickets,
        coverImage: body?.coverImage || undefined,
      },
    });
    return { status: 200, event };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ event: toPlain(result.event) });
}
