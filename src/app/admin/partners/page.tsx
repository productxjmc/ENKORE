import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import AdminPartnersDashboard from "@/components/admin/AdminPartnersDashboard";
import type { PlainAffiliate } from "@/components/partners/PartnerDashboard";

// Ported from the Base44 app's src/pages/AdminAffiliates.jsx. proxy.ts
// protects /admin(/.*)? optimistically only, so this still checks for
// itself — same pattern as every other protected page in this app.
export default async function AdminPartnersPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const affiliates = await withCurrentUser((tx) => tx.affiliate.findMany({ orderBy: { createdAt: "desc" } }));

  return <AdminPartnersDashboard initialAffiliates={toPlain<PlainAffiliate[]>(affiliates)} />;
}
