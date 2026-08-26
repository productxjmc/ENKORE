import { NextResponse, type NextRequest } from "next/server";
import { withCurrentUser } from "@/lib/auth";
import { firstFruitsApplicationSchema } from "@/lib/validation/firstFruits";

// Public endpoint — no auth required, matching the "no cap, no gatekeeping"
// design of First Fruits and the firstfruitsapplication_insert RLS policy
// (with check (true)). Runs through withCurrentUser rather than
// withServiceRole precisely because this is a path RLS already allows
// anonymously; there's no reason to escalate privileges for it.
//
// Status stays PENDING here — "we read every application ourselves" (copy
// doc) means a human reviews and accepts it, within the 7-21 working day
// window, not that submission = instant acceptance. See admin review flow
// (not yet built) for where status flips to ACCEPTED and, eventually, the
// acceptance email sends.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = firstFruitsApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid application", issues: parsed.error.issues }, { status: 400 });
  }

  // .create() implicitly does INSERT ... RETURNING "id", and Postgres RLS
  // applies the table's SELECT policy to that RETURNING output — so an
  // anonymous submitter passes the (public) INSERT check but then gets
  // rejected reading back the row, because SELECT here is admin-only.
  // .createMany() has no RETURNING clause, which sidesteps that read-back
  // entirely; we don't need the generated id back anyway. See prisma/rls.sql
  // for the same note anywhere else a public-insert table appears.
  await withCurrentUser((tx) =>
    tx.firstFruitsApplication.createMany({
      data: [parsed.data],
    }),
  );

  return NextResponse.json({ ok: true }, { status: 201 });
}
