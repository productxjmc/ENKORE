import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";

// Backs EventQRCode.tsx's ad-hoc "connect at this event" QR — a fan
// scanning it just becomes a Follow with source LIVE_EVENT_QR and a
// free-text location, no specific Event row involved (unlike Phase 10's
// check-in, which is tied to one Event and issues a discount code).
// follow_insert RLS is public (`with check (true)`), but Fan write still
// requires an owning session (userId/email match) — an anonymous fan has
// none, so this runs under withServiceRole for the Fan upsert, same
// justification as the Phase 10 check-in route.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id: musicianId } = await ctx.params;

  const body = await req.json().catch(() => null);
  const fanName = typeof body?.fanName === "string" ? body.fanName.trim().slice(0, 120) : "";
  const fanEmail = typeof body?.fanEmail === "string" ? body.fanEmail.trim().toLowerCase() : "";
  const location = typeof body?.location === "string" ? body.location.trim().slice(0, 200) : "";

  if (!fanName || !fanEmail) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });

  type Result = { status: 404; error: string } | { status: 200; musicianName: string; storefrontUrl: string | null; alreadyFollowing: boolean };

  const result = await withServiceRole<Result>(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404, error: "Musician not found" };

    let fan = await tx.fan.findUnique({ where: { email: fanEmail } });
    if (fan) {
      fan = await tx.fan.update({ where: { id: fan.id }, data: { fullName: fanName } });
    } else {
      fan = await tx.fan.create({ data: { fullName: fanName, email: fanEmail } });
    }

    const existingFollow = await tx.follow.findUnique({ where: { fanId_musicianId: { fanId: fan.id, musicianId } } });
    if (!existingFollow) {
      await tx.follow.create({
        data: { fanId: fan.id, musicianId, fanEmail, fanName, source: "LIVE_EVENT_QR", location: location || undefined },
      });
    }

    return { status: 200, musicianName: musician.musicianName, storefrontUrl: musician.storefrontUrl, alreadyFollowing: Boolean(existingFollow) };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(result);
}
