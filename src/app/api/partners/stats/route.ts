import { NextResponse } from "next/server";
import { withServiceRole } from "@/lib/authContext";

const TOTAL_FOUNDING_SEATS = 100;

// Ported from the Base44 app's base44/functions/getPartnerStats/entry.ts.
// Public — only returns aggregate counts, never partner PII. Needs
// service role because affiliate_select's RLS only allows a caller to
// see their own row (by userId/email) or an admin to see all — counting
// "how many partners exist" is a legitimate cross-row read no individual
// caller's session context can satisfy.
export async function GET() {
  const { totalPartners, foundingCount } = await withServiceRole(async (tx) => {
    const [totalPartners, foundingCount] = await Promise.all([
      tx.affiliate.count(),
      tx.affiliate.count({ where: { foundingMember: true } }),
    ]);
    return { totalPartners, foundingCount };
  });

  return NextResponse.json({
    totalPartners,
    foundingMembers: foundingCount,
    foundingSeatsRemaining: Math.max(0, TOTAL_FOUNDING_SEATS - foundingCount),
    totalFoundingSeats: TOTAL_FOUNDING_SEATS,
  });
}
