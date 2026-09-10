import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const AUDIENCES = ["ALL_FOLLOWERS", "SUBSCRIBERS", "RECENT_BUYERS", "TICKET_HOLDERS"] as const;
const CHANNELS = ["APP", "EMAIL", "SMS", "WHATSAPP"] as const;
const RECENT_DAYS = 90;

const broadcastSchema = z.object({
  musicianId: z.string().min(1),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().max(2000).optional(),
  audience: z.enum(AUDIENCES),
  channel: z.enum(CHANNELS),
  preview: z.boolean().optional(),
});

// No SMS/email provider is wired up in this rebuild yet — this computes
// a genuine recipient count against real Fan.consent + engagement data
// and logs the submission to Broadcast, but does not actually send
// anything. Matches the locked "UI + consent logic only" scope for this
// phase. A recipient only counts if they have a linked Fan row (consent
// lives on Fan, not on the anonymous-checkout fanEmail some purchases
// carry) AND have opted into the selected channel.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = broadcastSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { musicianId, subject, message, audience, channel, preview } = parsed.data;
  if (!preview && !message) return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const result = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { id: musicianId, OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404 as const };

    let emails: string[];
    if (audience === "SUBSCRIBERS") {
      const subs = await tx.fanSubscription.findMany({ where: { musicianId, status: "ACTIVE" }, select: { fanEmail: true } });
      emails = subs.map((s) => s.fanEmail).filter((e): e is string => !!e);
    } else if (audience === "TICKET_HOLDERS") {
      const tix = await tx.ticketPurchase.findMany({ where: { musicianId, status: "CONFIRMED" }, select: { fanEmail: true } });
      emails = tix.map((t) => t.fanEmail).filter((e): e is string => !!e);
    } else if (audience === "RECENT_BUYERS") {
      const since = new Date(Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000);
      const purchases = await tx.purchase.findMany({ where: { musicianId, status: "COMPLETED", createdAt: { gte: since } }, select: { fanEmail: true } });
      emails = purchases.map((p) => p.fanEmail).filter((e): e is string => !!e);
    } else {
      const follows = await tx.follow.findMany({ where: { musicianId }, select: { fanEmail: true } });
      emails = follows.map((f) => f.fanEmail).filter((e): e is string => !!e);
    }

    const uniqueEmails = [...new Set(emails)];
    const fans = uniqueEmails.length ? await tx.fan.findMany({ where: { email: { in: uniqueEmails } } }) : [];
    const recipientCount = fans.filter((f) => {
      const consent = f.consent as Record<string, boolean> | null;
      return consent?.[channel.toLowerCase()] === true;
    }).length;

    if (preview) return { status: 200 as const, recipientCount, id: null };

    const broadcast = await tx.broadcast.create({
      data: { musicianId, subject, message: message!, channel, audience, recipientCount },
    });

    return { status: 200 as const, recipientCount, id: broadcast.id };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, id: result.id, recipientCount: result.recipientCount });
}
