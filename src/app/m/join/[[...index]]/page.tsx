import { SignUp } from "@clerk/nextjs";

// Catch-all per Clerk's own convention for embedded <SignUp/> — its
// internal steps (email verification, etc.) navigate to sub-paths under
// this route, which 404 without the [[...index]] catch-all.
//
// This is the first embedded Clerk UI component anywhere in this codebase
// — everything else (dashboard, admin, partners) has relied on Clerk's
// hosted account-portal redirect via src/proxy.ts's clerkMiddleware(). The
// design wants an in-app, on-brand signup screen instead, so this reskins
// <SignUp/> via the appearance prop rather than redirecting out.
//
// "Everyone is a member first" (per the design): Clerk itself only
// collects identity (name/email/password) here. Mobile number, city, and
// per-channel consent — plus the "I'm a musician" branch — are collected
// right after, on /m/join/profile, once a Fan row exists to attach them to.
export default function MobileJoinPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          Join ENKORE
        </p>
        <h1 className="mt-2 text-[26px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">
          Everyone is a member first
        </h1>
      </div>
      <SignUp
        routing="path"
        path="/m/join"
        signInUrl="/m/signin"
        forceRedirectUrl="/m/join/profile"
        appearance={{
          variables: {
            colorPrimary: "#FF3700",
            colorForeground: "#201e1d",
            colorMutedForeground: "#605d5d",
            colorBackground: "#f3f2f2",
            colorInput: "#eae9e9",
            colorInputForeground: "#201e1d",
            fontFamily: "var(--font-archivo), Archivo, sans-serif",
            borderRadius: "0px",
          },
          elements: {
            card: "shadow-none border-2 w-full max-w-[420px]",
            headerTitle: "hidden",
            headerSubtitle: "hidden",
            footer: "bg-transparent",
            formButtonPrimary: "min-h-[52px] font-bold text-[13px] normal-case",
            formFieldInput: "min-h-[48px] border-2",
          },
        }}
      />
    </div>
  );
}
