import { NextResponse, type NextRequest } from "next/server";
import { withServiceRole } from "@/lib/authContext";

// Fired once per referral-link visit (see musician-pre-register/page.tsx's
// existing ?ref= capture) — the other missing half of the referral
// pipeline alongside creditReferral.ts. Anonymous by nature (a visitor
// hasn't signed in), so this has to run under withServiceRole:
// affiliate_write RLS only allows the affiliate's own row or an admin.
// Best-effort: a failed click ping should never block the page the
// visitor is actually trying to see.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const referralCode = typeof body?.referralCode === "string" ? body.referralCode.trim() : "";
  if (!referralCode) return NextResponse.json({ ok: false }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;

  await withServiceRole((tx) =>
    tx.affiliate.updateMany({
      where: { referralCode },
      data: { clicks: { increment: 1 }, lastClickAt: new Date(), lastClickIp: ip ?? undefined },
    }),
  ).catch(() => {});

  return NextResponse.json({ ok: true });
}
