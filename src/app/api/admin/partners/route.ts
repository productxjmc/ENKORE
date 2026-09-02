import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";

// Admin-only list + manual-create for the Partner Program. Runs under the
// caller's own (admin) RLS context via withCurrentUser, not withServiceRole
// — affiliate_select/affiliate_write's RLS policies already allow an admin
// to read/write rows that aren't their own. See prisma/rls.sql.
export async function GET() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const affiliates = await withCurrentUser((tx) => tx.affiliate.findMany({ orderBy: { createdAt: "desc" } }));

  // toPlain() converts Decimal fields to real numbers — Decimal's own
  // toJSON() serializes them as strings, which would silently diverge from
  // the PlainAffiliate[] shape page.tsx's server-rendered initial list uses.
  return NextResponse.json({ affiliates: toPlain(affiliates) });
}

// Ported from the Base44 app's AdminAffiliates.jsx createAffiliateMutation —
// a manual add for partners who weren't self-activated (e.g. signed up
// offline, at an event).
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!email || !name) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  type CreateResult = { status: 409; error: string } | { status: 201; affiliate: unknown };

  const result = await withCurrentUser<CreateResult>(async (tx) => {
    const existing = await tx.affiliate.findUnique({ where: { email } });
    if (existing) return { status: 409, error: "A partner with this email already exists" };

    let referralCode = "";
    for (let attempt = 0; attempt < 10; attempt++) {
      const candidate = Math.random().toString(36).slice(2, 10).toUpperCase();
      const clash = await tx.affiliate.findUnique({ where: { referralCode: candidate } });
      if (!clash) {
        referralCode = candidate;
        break;
      }
    }
    if (!referralCode) return { status: 409, error: "Could not generate a unique referral code, try again" };

    const affiliate = await tx.affiliate.create({
      data: { email, name, referralCode },
    });
    return { status: 201, affiliate };
  });

  if (result.status !== 201) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ affiliate: toPlain(result.affiliate) }, { status: 201 });
}
