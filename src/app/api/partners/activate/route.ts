import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { getCurrentAppUser } from "@/lib/auth";
import { withServiceRole } from "@/lib/authContext";
import { toPlain } from "@/lib/serialize";

// Ported from the Base44 app's base44/functions/activatePartner/entry.ts.
//
// Creates a partner (Affiliate) record, or submits a ministry-tier upgrade.
// Founding-seat counting and referral-code uniqueness both require reading
// across every partner's row, which a normal caller's own RLS context can't
// see (affiliate_select only allows "own row or admin") — this runs under
// withServiceRole for the same reason /api/partners/stats does: a real
// cross-user business invariant, not "the caller says they're admin". The
// caller's identity itself still comes only from getCurrentAppUser()'s
// verified Clerk session, never from the request body.
const TOTAL_FOUNDING_SEATS = 100;
const BASE_COMMISSION_ZAR = 200;
const MAX_CODE_ATTEMPTS = 8;

function generateCode(email: string): string {
  const base =
    email
      .split("@")[0]
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 6) || "ENKORE";
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `${base}${suffix}`;
}

async function uniqueCode(tx: Prisma.TransactionClient, email: string): Promise<string> {
  for (let i = 0; i < MAX_CODE_ATTEMPTS; i++) {
    const code = generateCode(email);
    const clash = await tx.affiliate.findUnique({ where: { referralCode: code } });
    if (!clash) return code;
  }
  return `ENK${Date.now().toString(36).toUpperCase()}`;
}

export async function POST(req: NextRequest) {
  const user = await getCurrentAppUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const action = body?.action === "ministry_upgrade" ? "ministry_upgrade" : "activate";
  const ministry = body?.ministry ?? {};

  type Result =
    | { status: 422; error: string }
    | { status: 409; error: string }
    | { status: 200; affiliate: unknown; alreadyPending?: boolean; alreadyActive?: boolean; foundingMember?: boolean };

  const result = await withServiceRole<Result>(async (tx) => {
    const partner = await tx.affiliate.findFirst({ where: { email: user.email } });

    // ── Ministry upgrade on an existing partner ─────────────────────────
    if (partner && action === "ministry_upgrade") {
      if (!ministry.ministryName || !ministry.ministryRole) {
        return { status: 422, error: "Ministry name and role are required." };
      }
      if (partner.verificationStatus === "PENDING") {
        return { status: 200, affiliate: partner, alreadyPending: true };
      }
      if (partner.verificationStatus === "APPROVED") {
        return { status: 409, error: "Your ministry tier is already approved." };
      }

      const updated = await tx.affiliate.update({
        where: { id: partner.id },
        data: {
          ministryName: String(ministry.ministryName).slice(0, 200),
          ministryRole: String(ministry.ministryRole).slice(0, 200),
          verificationStatus: "PENDING",
          // tier and isVerified deliberately untouched — an admin grants those.
        },
      });
      return { status: 200, affiliate: updated };
    }

    // ── Already activated, nothing to do ────────────────────────────────
    if (partner) {
      return { status: 200, affiliate: partner, alreadyActive: true };
    }

    // ── Create a new partner record ─────────────────────────────────────
    // Founding status is counted here, server-side, not asserted by the
    // client — otherwise anyone could claim a founding seat after they'd
    // run out, same reasoning as the source's own comment.
    const foundingCount = await tx.affiliate.count({ where: { foundingMember: true } });
    const isFounding = foundingCount < TOTAL_FOUNDING_SEATS;
    const wantsMinistry = Boolean(ministry.ministryName);

    const appUser = await tx.user.findUnique({ where: { id: user.id } });

    const created = await tx.affiliate.create({
      data: {
        userId: user.id,
        email: user.email,
        name: appUser?.fullName || "",
        referralCode: await uniqueCode(tx, user.email),
        tier: "COMMUNITY",
        foundingMember: isFounding,
        isVerified: false,
        verificationStatus: wantsMinistry ? "PENDING" : "NOT_SUBMITTED",
        ministryName: wantsMinistry ? String(ministry.ministryName).slice(0, 200) : undefined,
        ministryRole: wantsMinistry ? String(ministry.ministryRole || "").slice(0, 200) : undefined,
        joinedAt: new Date(),
        commissionPerConversion: BASE_COMMISSION_ZAR,
      },
    });

    return { status: 200, affiliate: created, foundingMember: isFounding };
  });

  if (result.status !== 200) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    success: true,
    // toPlain() converts Decimal fields to real numbers — without it,
    // Decimal's own toJSON() serializes them as strings, breaking the
    // PlainAffiliate shape PartnerDashboard's client-side setAffiliate expects.
    affiliate: toPlain(result.affiliate),
    ...(result.alreadyPending ? { already_pending: true } : {}),
    ...(result.alreadyActive ? { already_active: true } : {}),
    ...(result.foundingMember !== undefined ? { founding_member: result.foundingMember } : {}),
  });
}
