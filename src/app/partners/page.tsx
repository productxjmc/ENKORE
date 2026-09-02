import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import PartnerDashboard, { type PlainAffiliate } from "@/components/partners/PartnerDashboard";

// Ported from the Base44 app's src/pages/AffiliateDashboard.jsx. proxy.ts
// protects /partners, so `user` is always real here in practice — but that
// gate is optimistic-only (see the same note on musician-pre-register's
// dashboard smoke test), so this still checks for itself rather than
// trusting it was gated upstream.
//
// Server component reads the caller's own Affiliate row directly — RLS's
// affiliate_select already allows "userId = me OR email = me OR admin",
// so no separate GET /api/partners/me endpoint is needed for this.
export default async function PartnersPage() {
  const user = await getCurrentAppUser();
  if (!user) return null;

  const affiliate = await withCurrentUser((tx) => tx.affiliate.findFirst({ where: { email: user.email } }));

  return <PartnerDashboard affiliate={affiliate ? toPlain<PlainAffiliate>(affiliate) : null} />;
}
