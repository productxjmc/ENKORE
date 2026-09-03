import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import MerchandiseManagementDashboard, { type PlainMerchandise } from "@/components/dashboard/MerchandiseManagementDashboard";

// Ported from the Base44 app's src/pages/MerchandiseManagement.jsx —
// scoped to the caller's own musician throughout, fixing the source's
// real multi-tenant bug (Musician.list()[0], Merchandise unfiltered).
export default async function MerchandisePage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    const items = await tx.merchandise.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "desc" } });
    return { musicianId: musician.id, items };
  });

  if (!data) redirect("/musician-pre-register");

  return <MerchandiseManagementDashboard musicianId={data.musicianId} initialItems={toPlain<PlainMerchandise[]>(data.items)} />;
}
