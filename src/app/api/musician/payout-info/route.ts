import { NextResponse, type NextRequest } from "next/server";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";

// New — Base44 never had a way to actually set bank details, only
// referenced them (and inconsistently: some components read the wrong
// field entirely, see PayoutsDashboard.tsx's comment). Upserts against
// MusicianPayoutInfo; musicianpayoutinfo_write RLS already covers
// owner-or-admin for all operations, so withCurrentUser is enough.
export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const bankName = typeof body?.bankName === "string" ? body.bankName.trim() : "";
  const accountNumber = typeof body?.accountNumber === "string" ? body.accountNumber.trim() : "";

  const result = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return { status: 404 as const, error: "Musician not found" };

    await tx.musicianPayoutInfo.upsert({
      where: { musicianId: musician.id },
      create: { musicianId: musician.id, bankName: bankName || null, accountNumber: accountNumber || null },
      update: { bankName: bankName || null, accountNumber: accountNumber || null },
    });

    return { status: 200 as const };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
