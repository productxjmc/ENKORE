import Link from "next/link";
import { getCurrentAppUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import ProfileConsentForm from "@/components/mobile/ProfileConsentForm";
import SignOutButton from "@/components/mobile/SignOutButton";

// Currency preference and "account & data" (export/delete) are real Phase
// 1 scope per the plan but genuinely need more than a placeholder to be
// honest — currency reuses pricingConfig.ts once Phase 2 has priced
// content to test it against, and data export/delete needs a POPIA-
// correct deletion flow, not a stub button that claims to work. What's
// here now — identity, per-channel consent, sign out — is real.
export default async function MobileProfilePage() {
  const user = await getCurrentAppUser();
  if (!user) {
    return (
      <div className="flex flex-col items-center gap-4 p-6 text-center">
        <p className="text-[14px]" style={{ color: "var(--m-text-muted)" }}>
          Sign in to see your profile.
        </p>
        <Link href="/m/signin" className="min-h-[48px] px-6 py-3 text-[13px] font-bold text-white" style={{ background: "var(--m-accent)" }}>
          Sign in
        </Link>
      </div>
    );
  }

  const fan = await getCurrentFan();

  return (
    <div className="flex flex-col gap-6 p-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          Account
        </p>
        <h1 className="mt-2 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">
          {fan?.fullName || user.email}
        </h1>
        <p className="mt-1 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{user.email}</p>
      </div>

      <ProfileConsentForm initialConsent={fan?.consent ?? { app: true, email: true, sms: false, whatsapp: false }} />

      <div className="border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <SignOutButton />
      </div>
    </div>
  );
}
