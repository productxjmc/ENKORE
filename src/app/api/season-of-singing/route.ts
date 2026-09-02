import { NextResponse, type NextRequest } from "next/server";
import { withCurrentUser } from "@/lib/auth";
import { seasonOfSingingApplicationSchema } from "@/lib/validation/seasonOfSinging";

// Public — no auth required, matching seasonofsingingapplication_insert's
// `with check (true)` in prisma/rls.sql. Uses createMany (not create) for
// the same RLS-RETURNING reason documented on the musician-pre-register
// and (former) first-fruits routes: SELECT on this table is admin-only,
// and Prisma's .create() implicitly does INSERT ... RETURNING, which
// Postgres RLS checks against SELECT too.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = seasonOfSingingApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application", issues: parsed.error.issues }, { status: 400 });
  }

  await withCurrentUser((tx) =>
    tx.seasonOfSingingApplication.createMany({
      data: [parsed.data],
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
