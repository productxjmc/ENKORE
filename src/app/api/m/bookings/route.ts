import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";

const BOOKING_EVENT_TYPES = ["WEDDING", "CORPORATE", "CHURCH_SERVICE", "CONCERT", "PRIVATE_PARTY", "FESTIVAL", "OTHER"] as const;

const bookingSchema = z.object({
  musicianId: z.string().min(1),
  eventName: z.string().trim().min(1).max(200),
  eventDate: z.string().min(1),
  eventType: z.enum(BOOKING_EVENT_TYPES).optional(),
  venue: z.string().trim().max(200).optional(),
  budget: z.string().trim().max(100).optional(),
  sponsored: z.boolean().optional(),
  organizerName: z.string().trim().min(1).max(200),
  organizerEmail: z.email(),
  organizerPhone: z.string().trim().max(50).optional(),
  message: z.string().trim().max(1000).optional(),
});

// bookingenquiry_insert in prisma/rls.sql is `with check (true)` —
// "public booking request form, no account required." But Prisma's
// create() always does an implicit RETURNING, which Postgres checks
// against the SELECT policy on the new row, not the INSERT policy —
// and bookingenquiry_select only allows the musician's owner, the
// organizer's own authenticated email, or an admin. An anonymous
// submitter matches none of those, so under withCurrentUser this reads
// as "new row violates row-level security policy" even though the
// insert itself is unconditionally allowed. Same shape of problem
// /api/m/wall solves by writing through withServiceRole instead.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, eventDate, ...rest } = parsed.data;

  const parsedDate = new Date(eventDate);
  if (Number.isNaN(parsedDate.getTime())) {
    return NextResponse.json({ error: "Invalid event date" }, { status: 400 });
  }

  const result = await withServiceRole(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId }, select: { id: true } });
    if (!musician) return { status: 404 as const };

    const enquiry = await tx.bookingEnquiry.create({
      data: { musicianId, eventDate: parsedDate, ...rest },
    });
    return { status: 200 as const, enquiry };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.enquiry.id });
}
