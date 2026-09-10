import type { Prisma } from "@prisma/client";

// Credits a partner's Affiliate row for a referred musician getting
// approved — this is the missing half of the referral pipeline: the
// referral CODE was already threaded from ?ref= through pre-registration
// through to Musician.referralCode (see the approve route), but nothing
// ever consumed it to actually credit anyone. Ministry/Ambassador tiers
// get a flat commissionPerConversion (per-conversion field already on
// Affiliate); the church-multiplier bonus (R1,000 per musician, Ministry+
// only) is additive on top, per the marketing copy's own "R1,000 Church
// Multiplier for every musician you onboard" framing.
const CHURCH_MULTIPLIER_ZAR = 1000;

export async function creditReferral(
  tx: Prisma.TransactionClient,
  referralCode: string,
  musician: { id: string; musicianName: string; email: string },
): Promise<{ credited: boolean }> {
  const affiliate = await tx.affiliate.findUnique({ where: { referralCode } });
  if (!affiliate || affiliate.status !== "ACTIVE") return { credited: false };

  const baseCommission = Number(affiliate.commissionPerConversion);
  const churchBonus = affiliate.tier === "MINISTRY" || affiliate.tier === "AMBASSADOR" ? CHURCH_MULTIPLIER_ZAR : 0;
  const totalCredit = baseCommission + churchBonus;

  await tx.affiliate.update({
    where: { id: affiliate.id },
    data: {
      conversions: { increment: 1 },
      pendingEarnings: { increment: totalCredit },
      ...(churchBonus > 0 ? { churchMultiplierEarned: { increment: churchBonus } } : {}),
    },
  });

  await tx.affiliateConversion.create({
    data: {
      affiliateId: affiliate.id,
      musicianId: musician.id,
      musicianName: musician.musicianName,
      musicianEmail: musician.email,
      commissionEarned: totalCredit,
    },
  });

  return { credited: true };
}
