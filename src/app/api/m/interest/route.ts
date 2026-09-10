import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";
import { getCurrentFan } from "@/lib/fan";

const interestSchema = z.object({
  musicianId: z.string().min(1),
});

// interestsignal_insert in prisma/rls.sql is `with check (true)` — a
// lead-gen signal, same "no account required" shape as Follow — but a
// signed-in fan's own email is used when available so the unique
// (musicianId, fanEmail, kind) constraint actually dedupes for them
// across devices, matching the anonymous-checkout convention used
// elsewhere (fanEmail as the identity key, not fanId).
//
// withServiceRole, not withCurrentUser: Prisma's create() does an
// implicit RETURNING, which Postgres checks against interestsignal_select
// (owns_musician or is_admin) — a fan signaling interest matches neither,
// so under the caller's own context this reads as an RLS violation even
// though the insert itself is unconditionally allowed. Same bug, same
// fix as /api/m/bookings.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = interestSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId } = parsed.data;

  const fan = await getCurrentFan();
  if (!fan) return NextResponse.json({ error: "Sign in to get notified" }, { status: 401 });

  const result = await withServiceRole(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId }, select: { id: true } });
    if (!musician) return { status: 404 as const };

    const existing = await tx.interestSignal.findUnique({
      where: { musicianId_fanEmail_kind: { musicianId, fanEmail: fan.email, kind: "NOTIFY" } },
    });
    if (existing) return { status: 200 as const, alreadySignaled: true };

    await tx.interestSignal.create({
      data: { musicianId, fanId: fan.id, fanEmail: fan.email, fanName: fan.fullName, kind: "NOTIFY" },
    });
    return { status: 200 as const, alreadySignaled: false };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, alreadySignaled: result.alreadySignaled });
}
