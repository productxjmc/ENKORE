import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// Draft-save half of the onboarding flow — ported from PrepareForLaunch.jsx's
// saveProgress() (called on every "Save & Continue") and its press-photo
// upload's immediate profileImage side effect. Both go through musician_write
// RLS (owner-or-admin), so withCurrentUser is enough — no admin-write field
// is touched here, unlike the submit route below.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const onboardingDocs = body?.onboardingDocs;
  const profileImage = typeof body?.profileImage === "string" ? body.profileImage : undefined;

  if (onboardingDocs === undefined && profileImage === undefined) {
    return NextResponse.json({ error: "Nothing to save" }, { status: 400 });
  }

  const data: Prisma.MusicianUpdateInput = {};
  if (onboardingDocs !== undefined) {
    data.onboardingDocs = onboardingDocs;
    data.onboardingStep = "DOCS_SUBMITTED";
  }
  if (profileImage !== undefined) data.profileImage = profileImage;

  const result = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };
    await tx.musician.update({ where: { id: musician.id }, data });
    return { status: 200 as const };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
