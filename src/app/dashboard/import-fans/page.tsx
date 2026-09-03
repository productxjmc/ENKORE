import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import ImportFansDashboard from "@/components/dashboard/ImportFansDashboard";

// New feature (not part of the original 14-phase plan): musicians upload a
// CSV/PDF/DOCX of fan emails, review the extracted list, and confirm to
// add them as followers. See src/lib/fanImport.ts for extraction and
// src/app/api/musician/fans/import/{parse,confirm}/route.ts for the two
// server steps.
export default async function ImportFansPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const musician = await withCurrentUser((tx) =>
    tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true } }),
  );
  if (!musician) redirect("/musician-pre-register");

  return <ImportFansDashboard musicianId={musician.id} />;
}
