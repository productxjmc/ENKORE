import { redirect } from "next/navigation";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import OnboardingWizard, { type OnboardingDocs } from "@/components/dashboard/OnboardingWizard";

// Ported from the Base44 app's src/pages/PrepareForLaunch.jsx. Same
// musician-resolution pattern as /dashboard — see that page.tsx's comment.
// Base44 redirected AWAY from this page once onboarding_step === 'launched';
// this does the inverse of /dashboard's (not yet added) redirect INTO this
// page for docs_pending musicians, kept as two independent checks rather
// than one shared redirect table, matching how the source kept them apart.
export default async function OnboardingPage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/");

  const musician = await withCurrentUser((tx) =>
    tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] } }),
  );
  if (!musician) redirect("/musician-pre-register");
  if (musician.onboardingStep === "LAUNCHED") redirect("/dashboard");

  return <OnboardingWizard musicianId={musician.id} initialDocs={(musician.onboardingDocs as OnboardingDocs | null) ?? {}} />;
}
