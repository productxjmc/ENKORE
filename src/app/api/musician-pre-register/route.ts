import { NextResponse, type NextRequest } from "next/server";
import { withCurrentUser } from "@/lib/auth";
import { musicianPreRegistrationSchema } from "@/lib/validation/musicianPreRegistration";

// Public — no auth required, matching musicianprereg_insert's
// `with check (true)` in prisma/rls.sql. Uses createMany (not create) for
// the same reason documented there and in the First Fruits route: SELECT
// on this table is admin-only, and Prisma's .create() implicitly does
// INSERT ... RETURNING, which Postgres RLS checks against SELECT too.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = musicianPreRegistrationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application", issues: parsed.error.issues }, { status: 400 });
  }

  await withCurrentUser((tx) =>
    tx.musicianPreRegistration.createMany({
      data: [parsed.data],
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
