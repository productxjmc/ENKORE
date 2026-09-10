import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().optional().or(z.literal("")),
  role: z.string().trim().max(80).optional(),
});

// musicianteammember_write RLS is owns_musician-gated — withCurrentUser
// is enough, no service-role bypass needed.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = teamMemberSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request", issues: parsed.error.issues }, { status: 400 });
  const { name, email, role } = parsed.data;

  const result = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404 as const };

    const member = await tx.musicianTeamMember.create({ data: { musicianId: musician.id, name, email: email || undefined, role: role || undefined } });
    return { status: 200 as const, member };
  });

  if (result.status !== 200) return NextResponse.json({ error: "Musician not found" }, { status: result.status });
  return NextResponse.json({ ok: true, member: result.member });
}
