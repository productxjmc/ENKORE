import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import AdminRequirementReviewDashboard, { type PlainReviewMusician } from "@/components/admin/AdminRequirementReviewDashboard";

// Ported from the Base44 app's src/pages/AdminRequirementReview.jsx.
// Mirrors src/app/admin/partners/page.tsx's shape exactly.
export default async function AdminRequirementsPage() {
  const user = await getCurrentAppUser();
  if (!user || user.role !== "ADMIN") redirect("/");

  const musicians = await withCurrentUser((tx) =>
    tx.musician.findMany({
      where: { requirementsStatus: { in: ["PENDING_REVIEW", "APPROVED", "CHANGES_REQUESTED"] } },
      orderBy: { requirementsSubmittedAt: "desc" },
    }),
  );

  return <AdminRequirementReviewDashboard initialMusicians={toPlain<PlainReviewMusician[]>(musicians)} />;
}
