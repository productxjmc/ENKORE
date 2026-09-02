import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

type Action = "approve_ministry" | "reject" | "promote" | "set_status";

// Ported from the Base44 app's AdminAffiliates.jsx approveTier/rejectTier/
// promoteTier mutations, collapsed into one action-based endpoint rather
// than a generic field patch — the admin UI only ever needs these specific
// transitions, and this keeps tier/verification changes to the exact rules
// the source enforced (e.g. promote only ever moves community -> ministry
// -> ambassador, never backwards, never skips).
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = body?.action as Action | undefined;

  type PatchResult = { status: 404; error: string } | { status: 400; error: string } | { status: 200; affiliate: unknown };

  const result = await withCurrentUser<PatchResult>(async (tx) => {
    const affiliate = await tx.affiliate.findUnique({ where: { id } });
    if (!affiliate) return { status: 404, error: "Partner not found" };

    switch (action) {
      case "approve_ministry": {
        const updated = await tx.affiliate.update({
          where: { id },
          data: { tier: "MINISTRY", isVerified: true, verificationStatus: "APPROVED" },
        });
        return { status: 200, affiliate: updated };
      }
      case "reject": {
        const updated = await tx.affiliate.update({
          where: { id },
          data: { verificationStatus: "REJECTED", isVerified: false },
        });
        return { status: 200, affiliate: updated };
      }
      case "promote": {
        const nextTier = affiliate.tier === "COMMUNITY" ? "MINISTRY" : "AMBASSADOR";
        const updated = await tx.affiliate.update({
          where: { id },
          data: { tier: nextTier, isVerified: true, verificationStatus: "APPROVED" },
        });
        return { status: 200, affiliate: updated };
      }
      case "set_status": {
        const status = body?.status;
        if (status !== "ACTIVE" && status !== "INACTIVE" && status !== "SUSPENDED") {
          return { status: 400, error: "Invalid status" };
        }
        const updated = await tx.affiliate.update({ where: { id }, data: { status } });
        return { status: 200, affiliate: updated };
      }
      default:
        return { status: 400, error: "Unknown action" };
    }
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  // toPlain() converts Decimal fields to real numbers — see the note in
  // src/app/api/admin/partners/route.ts.
  return NextResponse.json({ affiliate: toPlain(result.affiliate) });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  await withCurrentUser((tx) => tx.affiliate.delete({ where: { id } }));

  return NextResponse.json({ ok: true });
}
