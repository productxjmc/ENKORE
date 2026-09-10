import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const checkinSchema = z.object({
  eventId: z.string().min(1),
  ticketCode: z.string().trim().min(1),
});

// Door-scanner validation — distinct from the pre-existing
// /api/events/[id]/check-in route, which is a FAN's own anonymous
// self-check-in (no ticket involved, issues a discount code). This one
// is musician-operated: scan a paid ticket's code, confirm it's real,
// unused, and for this event, then mark it attended. The
// Attendance.ticketPurchaseId unique constraint (not just this route's
// own lookup) is what actually stops the same ticket being let in
// twice — this check is the friendly error message, not the real gate.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const { eventId, ticketCode } = parsed.data;

  const result = await withCurrentUser(async (tx) => {
    const event = await tx.event.findFirst({ where: { id: eventId, musician: { OR: [{ userId: user.id }, { email: user.email }] } } });
    if (!event) return { status: 403 as const, error: "You don't manage this event" };

    const ticket = await tx.ticketPurchase.findUnique({ where: { ticketCode }, include: { attendance: true } });
    if (!ticket || ticket.eventId !== eventId) return { status: 404 as const, error: "Ticket not found for this event" };
    if (ticket.status !== "CONFIRMED") return { status: 409 as const, error: `This ticket is ${ticket.status.toLowerCase()}, not valid for entry` };
    if (ticket.attendance) return { status: 409 as const, error: `Already checked in at ${ticket.attendance.checkInTime?.toLocaleString() ?? "an earlier time"}` };

    const attendance = await tx.attendance.create({
      data: {
        eventId,
        musicianId: event.musicianId,
        ticketPurchaseId: ticket.id,
        fanId: ticket.fanId,
        fanName: ticket.fanName || "Ticket holder",
        fanEmail: ticket.fanEmail || "",
        checkInTime: new Date(),
        source: "QR_CODE",
      },
    });

    return { status: 200 as const, fanName: attendance.fanName, quantity: ticket.quantity };
  });

  if (result.status !== 200) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, fanName: result.fanName, quantity: result.quantity });
}
