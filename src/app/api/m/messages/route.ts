import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";

const messageSchema = z.object({
  musicianId: z.string().min(1),
  subject: z.string().trim().max(200).optional(),
  messageBody: z.string().trim().min(1).max(2000),
  // Only meaningful when the caller is the musician replying into an
  // existing thread — which fan they're replying to.
  fanEmail: z.email().optional(),
});

// Shared by both directions of the thread: a signed-in fan messaging a
// musician for the first time, and the musician replying. Which one this
// is gets resolved server-side from the caller's own identity, not a
// client-supplied "role" flag — matches message_insert's own RLS shape
// (owns_musician OR fanEmail = app.email()), so withCurrentUser is
// enough here, no service-role bypass needed for either direction.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, subject, messageBody, fanEmail } = parsed.data;

  const result = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id: musicianId } });
    if (!musician) return { status: 404 as const };

    const isOwner = musician.userId === user.id || musician.email === user.email;

    if (isOwner) {
      if (!fanEmail) return { status: 400 as const, error: "fanEmail is required when replying as the musician" };
      const fan = await tx.fan.findUnique({ where: { email: fanEmail } });
      const message = await tx.message.create({
        data: {
          musicianId,
          fanId: fan?.id,
          fanEmail,
          fanName: fan?.fullName,
          musicianEmail: musician.email,
          subject: subject || "Message from " + musician.musicianName,
          messageBody,
          senderType: "MUSICIAN",
        },
      });
      return { status: 200 as const, message };
    }

    const fan = await getCurrentFan();
    if (!fan) return { status: 403 as const, error: "Sign in as a fan to message this musician" };

    const message = await tx.message.create({
      data: {
        musicianId,
        fanId: fan.id,
        fanEmail: fan.email,
        fanName: fan.fullName,
        subject: subject || "Message from " + (fan.fullName || fan.email),
        messageBody,
        senderType: "FAN",
      },
    });
    return { status: 200 as const, message };
  });

  if (result.status !== 200) return NextResponse.json({ error: "error" in result ? result.error : "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.message.id });
}
