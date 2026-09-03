import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { sendRequirementsChangesRequestedEmail } from "@/lib/email/requirementsReview";

// Ported from AdminRequirementReview.jsx's handleRequestChanges.
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  if (!notes) {
    return NextResponse.json({ error: "Feedback notes are required" }, { status: 400 });
  }

  type Result = { status: 404; error: string } | { status: 200; email: string; musicianName: string };

  const result = await withCurrentUser<Result>(async (tx) => {
    const musician = await tx.musician.findUnique({ where: { id } });
    if (!musician) return { status: 404, error: "Musician not found" };

    await tx.musician.update({
      where: { id },
      data: { requirementsStatus: "CHANGES_REQUESTED", requirementsNotes: notes },
    });

    return { status: 200, email: musician.email, musicianName: musician.musicianName };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  await sendRequirementsChangesRequestedEmail(result.email, result.musicianName, notes);

  return NextResponse.json({ ok: true });
}
