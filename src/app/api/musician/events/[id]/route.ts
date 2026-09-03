import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

const VALID_STATUSES = ["UPCOMING", "SOLD_OUT", "CANCELLED", "COMPLETED"];

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const status = body?.status;
  if (!VALID_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });

  const result = await withCurrentUser((tx) => tx.event.updateMany({ where: { id }, data: { status } }));
  if (result.count === 0) return NextResponse.json({ error: "Event not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await withCurrentUser((tx) => tx.event.deleteMany({ where: { id } }));
  return NextResponse.json({ ok: true });
}
