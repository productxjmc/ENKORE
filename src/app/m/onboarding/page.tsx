import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import OnboardingWizard from "@/components/mobile/OnboardingWizard";

export default async function MobileOnboardingPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/signin");

  const musician = await withCurrentUser((tx) => tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } }));
  if (!musician) redirect("/musician-pre-register");

  const docs = (musician.onboardingDocs as Record<string, string> | null) ?? {};

  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>Musician</p>
      <h1 className="mt-1.5 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Get approved</h1>
      <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
        Three documents and a photo. Reviewed by a person in 7–21 working days.
      </p>

      {musician.requirementsStatus === "PENDING_REVIEW" ? (
        <div className="mt-5 border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
          <p className="text-[15px] font-extrabold">Submitted — under review</p>
          <p className="mt-2 text-[13px]" style={{ color: "var(--m-text-muted)" }}>We&apos;ll let you know once it&apos;s been checked.</p>
        </div>
      ) : musician.requirementsStatus === "APPROVED" ? (
        <div className="mt-5 border-2 p-4 text-center" style={{ borderColor: "var(--m-line)" }}>
          <p className="text-[15px] font-extrabold">Approved</p>
        </div>
      ) : (
        <div className="mt-5">
          <OnboardingWizard
            musicianId={musician.id}
            initial={{
              artistBio: musician.bio ?? "",
              idDocumentUrl: docs.idDocumentUrl ?? "",
              bankConfirmationUrl: docs.bankConfirmationUrl ?? "",
              pressPhotoUrl: docs.pressPhotoUrl ?? "",
            }}
          />
        </div>
      )}
    </div>
  );
}
