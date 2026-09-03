import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";

const MAX_CONFIRM_FANS = 2000;
const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Second (write) step of the fan-import flow — the musician has reviewed
// the preview from .../parse/route.ts and is confirming the final list.
// Fan write RLS requires an owning session (the fan's own userId/email),
// which a musician importing someone else's email obviously doesn't have,
// so the Fan upsert + Follow create runs under withServiceRole — same
// justification as the Phase 10 check-in and Phase 12 connect routes.
// follow_insert RLS is public anyway; only the Fan side needs the bypass.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const rawFans = Array.isArray(body?.fans) ? body.fans : null;
  if (!rawFans || rawFans.length === 0) return NextResponse.json({ error: "No fans to import" }, { status: 400 });
  if (rawFans.length > MAX_CONFIRM_FANS) return NextResponse.json({ error: `Import is limited to ${MAX_CONFIRM_FANS} fans at a time` }, { status: 400 });

  const seen = new Set<string>();
  const fans: { email: string; name: string | null }[] = [];
  for (const raw of rawFans) {
    const email = typeof raw?.email === "string" ? raw.email.trim().toLowerCase() : "";
    if (!email || !EMAIL_RE.test(email) || seen.has(email)) continue;
    seen.add(email);
    const name = typeof raw?.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 120) : null;
    fans.push({ email, name });
  }
  if (fans.length === 0) return NextResponse.json({ error: "No valid emails to import" }, { status: 400 });

  const musician = await withCurrentUser((tx) => tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true } }));
  if (!musician) return NextResponse.json({ error: "Musician not found" }, { status: 404 });

  let imported = 0;
  let alreadyFollowing = 0;

  await withServiceRole(async (tx) => {
    for (const fan of fans) {
      let fanRow = await tx.fan.findUnique({ where: { email: fan.email } });
      if (!fanRow) {
        fanRow = await tx.fan.create({ data: { fullName: fan.name ?? undefined, email: fan.email } });
      } else if (fan.name && !fanRow.fullName) {
        fanRow = await tx.fan.update({ where: { id: fanRow.id }, data: { fullName: fan.name } });
      }

      const existingFollow = await tx.follow.findUnique({ where: { fanId_musicianId: { fanId: fanRow.id, musicianId: musician.id } } });
      if (existingFollow) {
        alreadyFollowing++;
        continue;
      }

      await tx.follow.create({
        data: { fanId: fanRow.id, musicianId: musician.id, fanEmail: fan.email, fanName: fan.name ?? undefined, source: "IMPORT" },
      });
      imported++;
    }
  });

  return NextResponse.json({ imported, alreadyFollowing, total: fans.length });
}
