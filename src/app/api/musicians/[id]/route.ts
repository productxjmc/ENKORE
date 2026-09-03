import { NextResponse, type NextRequest } from "next/server";
import { withCurrentUser } from "@/lib/auth";

// Minimal public musician lookup — backs the /connect/[id] landing page's
// header (name + photo) before a fan submits the connect form. Musician
// select RLS is public (`using (true)`, storefronts are public pages by
// product design — same policy src/app/[slug]/page.tsx already relies
// on), so this needs no service-role bypass.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;

  const musician = await withCurrentUser((tx) =>
    tx.musician.findUnique({ where: { id }, select: { musicianName: true, profileImage: true } }),
  );

  if (!musician) return NextResponse.json({ error: "Musician not found" }, { status: 404 });
  return NextResponse.json({ musician });
}
