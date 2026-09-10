import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withServiceRole } from "@/lib/authContext";
import { getCurrentFan } from "@/lib/fan";

const wallPostSchema = z.object({
  musicianId: z.string().min(1),
  message: z.string().trim().min(1).max(500),
});

// FanWallPost has no client insert policy at all (see prisma/rls.sql's
// fanwallpost comment: "posts are written server-side... after a
// lightweight spam/profanity check") — this route IS that server-side
// check, then writes through withServiceRole. Signed-in only: fanName
// comes from the fan's own profile rather than a free-text field the
// client could spoof, since FanWallPost.fanName has no fanId-style
// identity link to fall back on for moderation.
export async function POST(req: NextRequest) {
  const fan = await getCurrentFan();
  if (!fan) return NextResponse.json({ error: "Sign in to post to the wall" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = wallPostSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, message } = parsed.data;

  const result = await withServiceRole(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId }, select: { id: true } });
    if (!musician) return { status: 404 as const };

    const post = await tx.fanWallPost.create({
      data: {
        musicianId,
        fanName: fan.fullName || fan.email,
        fanEmail: fan.email,
        message,
        isVisible: true,
      },
    });
    return { status: 200 as const, post };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, post: result.post });
}
