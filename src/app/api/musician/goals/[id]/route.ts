import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // goal_write RLS scopes this delete to the caller's own musician's
  // goals already — a musicianId mismatch just deletes nothing.
  await withCurrentUser((tx) => tx.goal.deleteMany({ where: { id } }));

  return NextResponse.json({ ok: true });
}
