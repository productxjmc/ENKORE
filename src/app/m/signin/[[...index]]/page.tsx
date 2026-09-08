import { SignIn } from "@clerk/nextjs";

// Catch-all for the same reason as /m/join — Clerk's embedded <SignIn/>
// navigates to sub-paths internally (password reset, etc.).
export default function MobileSignInPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
          Welcome back
        </p>
        <h1 className="mt-2 text-[26px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">Sign in</h1>
      </div>
      <SignIn
        routing="path"
        path="/m/signin"
        signUpUrl="/m/join"
        forceRedirectUrl="/m"
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
