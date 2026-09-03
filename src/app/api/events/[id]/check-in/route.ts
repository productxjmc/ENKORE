import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";
import { toPlain } from "@/lib/serialize";

// Ported from the Base44 app's src/pages/EventCheckIn.jsx — a public page
// a fan reaches by scanning the event's QR code. attendance_insert and
// follow_insert RLS are both public (`with check (true)`) — a walk-up
// check-in needs no account — but Fan write requires owner match
// (userId/email = the CALLER's own identity), which an anonymous check-in
// has none of, so this runs under withServiceRole for the Fan upsert,
// same pattern as the merch-order route.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: eventId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const fanName = typeof body?.fanName === "string" ? body.fanName.trim().slice(0, 120) : "";
  const fanEmail = typeof body?.fanEmail === "string" ? body.fanEmail.trim().toLowerCase() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const neighborhood = typeof body?.neighborhood === "string" ? body.neighborhood.trim() : "";
  const province = typeof body?.province === "string" ? body.province.trim() : "";

  if (!fanName || !fanEmail) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; discountCode: string; musicianName: string; eventTitle: string; storefrontUrl: string | null };

  const result = await withServiceRole<Result>(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) return { status: 404, error: "Event not found" };

    const musician = await tx.musician.findUnique({ where: { id: event.musicianId } });
    if (!musician) return { status: 404, error: "Musician not found" };

    const locationData = city || neighborhood || province ? { neighborhood, city, province, country: "South Africa" } : undefined;
    const discountCode = `ENKORE${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await tx.attendance.create({
      data: {
        eventId,
        musicianId: event.musicianId,
        fanName,
        fanEmail,
        checkInTime: new Date(),
        locationData,
        source: "QR_CODE",
        discountCodeIssued: discountCode,
      },
    });

    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (fan) {
      fan = await tx.fan.update({ where: { id: fan.id }, data: { fullName: fanName, location: city || fan.location } });
    } else {
      fan = await tx.fan.create({ data: { fullName: fanName, email: fanEmail, location: city || undefined } });
    }

    const existingFollow = await tx.follow.findUnique({ where: { fanId_musicianId: { fanId: fan.id, musicianId: event.musicianId } } });
    if (!existingFollow) {
      await tx.follow.create({
        data: { fanId: fan.id, musicianId: event.musicianId, fanEmail, fanName, source: "LIVE_EVENT_QR", location: event.venue || city || undefined },
      });
    }

    return { status: 200, discountCode, musicianName: musician.musicianName, eventTitle: event.title, storefrontUrl: musician.storefrontUrl };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(toPlain(result));
}
