import { NextResponse, type NextRequest } from "next/server";
import { withCurrentUser } from "@/lib/auth";
import { seasonOfSingingApplicationSchema } from "@/lib/validation/seasonOfSinging";
import { sendSeasonOfSingingConfirmationEmail } from "@/lib/email/seasonOfSinging";

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

  // Fire-and-forget: sendEmail already soft-fails internally (logs and
  // returns rather than throwing) when no provider is configured, or if
  // the send itself fails — a confirmation email bouncing is never a
  // reason to fail an application that's already safely in the database.
  void sendSeasonOfSingingConfirmationEmail(parsed.data.email, parsed.data.artistName);

  return NextResponse.json({ ok: true }, { status: 201 });
}
