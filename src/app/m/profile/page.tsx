import Link from "next/link";
import { Trophy } from "lucide-react";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import { getCurrentFan } from "@/lib/fan";
import { getFanSupportRanks, supporterRankLabel } from "@/lib/fanSupportRank";
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
  const supportRanks = fan ? await withCurrentUser((tx) => getFanSupportRanks(tx, fan.email)) : [];

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

      {supportRanks.length > 0 && (
        <div>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Your support</p>
          <div className="flex flex-col gap-2">
            {supportRanks.map((r) => (
              <Link
                key={r.musicianId}
                href={`/m/u/${r.storefrontUrl ?? r.musicianId}`}
                className="flex items-center gap-3 border-2 p-3"
                style={{ borderColor: "var(--m-line)" }}
              >
                <Trophy className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />
                <span className="text-[13px] font-bold leading-[1.3]">{supporterRankLabel(r)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <ProfileConsentForm initialConsent={fan?.consent ?? { app: true, email: true, sms: false, whatsapp: false }} />

      <div className="border-t-2 pt-4" style={{ borderColor: "var(--m-line)" }}>
        <SignOutButton />
      </div>
    </div>
  );
}
