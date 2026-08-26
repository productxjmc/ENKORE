import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { withCurrentUser } from "@/lib/auth";
import { waitlistSchema } from "@/lib/validation/waitlist";

// Ported from the Base44 app's submitHomeWaitlist function, backed by the
// EarlyAccessSignup entity (already in schema.prisma from Stage 0 — no
// migration needed). Public, no auth, matching earlyaccesssignup_insert's
// `with check (true)` in prisma/rls.sql. Uses createMany, not create, for
// the same RETURNING-vs-admin-only-SELECT reason documented there and on
// every other public-insert route this session.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  try {
    await withCurrentUser((tx) =>
      tx.earlyAccessSignup.createMany({
        data: [{ email: parsed.data.email, source: "home_waitlist" }],
      }),
    );
  } catch (err) {
    // Same email signing up twice: EarlyAccessSignup.email is unique.
    // Treat as success rather than a confusing "already exists" error —
    // they're already on the list, which is what they wanted.
    const isDuplicate = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (!isDuplicate) {
      console.error("[waitlist] signup failed:", err);
      return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
