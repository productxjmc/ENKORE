import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import TrackUploadFormMobile from "@/components/mobile/TrackUploadFormMobile";

export default async function MobileUploadTrackPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const musician = await withCurrentUser((tx) => tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true } }));
  if (!musician) redirect("/musician-pre-register");

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Upload a track</h1>
      <div className="mt-5">
        <TrackUploadFormMobile musicianId={musician.id} />
      </div>
    </div>
  );
}
