import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { sendRequirementsApprovedEmail } from "@/lib/email/requirementsReview";

// Ported from AdminRequirementReview.jsx's handleApprove. Runs under the
// caller's own (admin) RLS context via withCurrentUser — musician_write's
// RLS already allows an admin to write rows that aren't their own, same
// reasoning as the existing admin-approve routes (musician-pre-registrations,
// season-of-singing).
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  type Result = { status: 404; error: string } | { status: 200; email: string; musicianName: string; storefrontUrl: string | null };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id } });
    if (!musician) return { status: 404, error: "Musician not found" };

    await tx.musician.update({
      where: { id },
      data: { requirementsStatus: "APPROVED", onboardingStep: "LAUNCHED", requirementsNotes: null },
    });

    return { status: 200, email: musician.email, musicianName: musician.musicianName, storefrontUrl: musician.storefrontUrl };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await sendRequirementsApprovedEmail(result.email, result.musicianName, result.storefrontUrl);

  return NextResponse.json({ ok: true });
}
