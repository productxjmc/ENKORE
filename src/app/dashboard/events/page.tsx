import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import EventsManagementDashboard, { type PlainEvent } from "@/components/dashboard/EventsManagementDashboard";

// Ported from the Base44 app's src/pages/EventsManagement.jsx — scoped
// to the caller's own musician throughout, fixing the source's real
// multi-tenant bug (Musician.list()[0], Event unfiltered), same fix as
// the merchandise dashboard page.
export default async function EventsPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    return tx.event.findMany({ where: { musicianId: musician.id }, orderBy: { eventDate: "desc" } });
  });

  if (!data) redirect("/musician-pre-register");

  return <EventsManagementDashboard initialEvents={toPlain<PlainEvent[]>(data)} />;
}
