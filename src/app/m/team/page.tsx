import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { toPlain } from "@/lib/serialize";
import TeamMembersList from "@/components/mobile/TeamMembersList";

export default async function MobileTeamPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const data = await withCurrentUser(async (tx) => {
    const musician = await tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } });
    if (!musician) return null;
    const members = await tx.musicianTeamMember.findMany({ where: { musicianId: musician.id }, orderBy: { createdAt: "asc" } });
    return { members };
  });

  if (!data) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Team members</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
        A shared reference list for your worship team or band — not a login. Everyone still signs in as you.
      </p>
      <div className="mt-5">
        <TeamMembersList initialMembers={toPlain<{ id: string; name: string; email: string | null; role: string | null }[]>(data.members)} />
      </div>
    </div>
  );
}
