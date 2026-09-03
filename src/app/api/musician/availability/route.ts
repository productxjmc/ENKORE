import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

// Ported from the Base44 app's src/components/bookings/AvailabilityManager.jsx.
// Base44's query used Mongo-style filter operators ($gte/$lte) directly
// against AvailabilitySlot.filter() — translated here to a plain Prisma
// range query, not a redesign. availabilityslot_write RLS already covers
// full owner CRUD.
export async function GET(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  if (!start || !end) return NextResponse.json({ error: "start and end query params are required" }, { status: 400 });

  const slots = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return [];
    return tx.availabilitySlot.findMany({
      where: { musicianId: musician.id, startTime: { gte: new Date(start) }, endTime: { lte: new Date(end) } },
      orderBy: { startTime: "asc" },
    });
  });

  return NextResponse.json({ slots: toPlain(slots) });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const startTime = body?.startTime ? new Date(body.startTime) : null;
  const endTime = body?.endTime ? new Date(body.endTime) : null;
  if (!startTime || !endTime || Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return NextResponse.json({ error: "Valid startTime and endTime are required" }, { status: 400 });
  }
  if (endTime <= startTime) return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; slot: unknown };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404, error: "Musician not found" };

    const slot = await tx.availabilitySlot.create({
      data: { musicianId: musician.id, musicianEmail: musician.email, startTime, endTime, status: "AVAILABLE" },
    });
    return { status: 200, slot };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ slot: toPlain(result.slot) });
}
