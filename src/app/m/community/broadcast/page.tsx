import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import BroadcastComposer from "@/components/mobile/BroadcastComposer";

export default async function MobileBroadcastPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const musician = await withCurrentUser((tx) => tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true, musicianName: true } }));
  if (!musician) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Broadcast</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
        Compose a message to a segment of your community. Sending isn&apos;t connected to email/SMS yet — this logs what you&apos;d send and who it would reach.
      </p>
      <div className="mt-5">
        <BroadcastComposer musicianId={musician.id} />
      </div>
    </div>
  );
}
