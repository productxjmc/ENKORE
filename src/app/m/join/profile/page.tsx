import { redirect } from "next/navigation";
import { getCurrentAppUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import JoinProfileForm from "@/components/mobile/JoinProfileForm";

// Lands here right after Clerk sign-up (see /m/join's forceRedirectUrl).
// getCurrentFan() is what actually creates the Fan row on first visit —
// this page just needs it to exist before the form can update it.
export default async function JoinProfilePage() {
  const user = await getCurrentAppUser();
  if (!user) redirect("/m/join");

  const fan = await getCurrentFan();
  if (!fan) redirect("/m/join");

  return <JoinProfileForm initialFullName={fan.fullName ?? ""} initialPhone={fan.phone ?? ""} initialCity={fan.location ?? ""} />;
}
