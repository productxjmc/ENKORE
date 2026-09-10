import { notFound, redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import TicketScanner from "@/components/mobile/TicketScanner";

export default async function MobileCheckinEventPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const event = await withCurrentUser((tx) => tx.event.findFirst({ where: { id: eventId, musician: { OR: [{ userId: user.id }, { email: user.email }] } } }));
  if (!event) notFound();

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Door check-in</p>
      <h1 className="mt-1.5 text-[20px] font-extrabold uppercase tracking-[-0.02em]">{event.title}</h1>
      <div className="mt-5">
        <TicketScanner eventId={event.id} />
      </div>
    </div>
  );
}
