import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (status !== "ACTIVE" && status !== "INACTIVE") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const result = await withCurrentUser((tx) => tx.merchandise.updateMany({ where: { id }, data: { status } }));
  if (result.count === 0) return NextResponse.json({ error: "Item not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await withCurrentUser((tx) => tx.merchandise.deleteMany({ where: { id } }));
  return NextResponse.json({ ok: true });
}
