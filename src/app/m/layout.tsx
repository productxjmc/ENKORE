import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import { getCurrentAppUser, withCurrentUser } from "@/lib/auth";
import ServiceWorkerRegister from "@/components/mobile/ServiceWorkerRegister";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import MobileShellProvider from "@/components/mobile/MobileShellProvider";
import "./mobile.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

// manifest is a plain static file (public/manifest.webmanifest), not
// Next's app/manifest.ts convention — that convention auto-links into
// EVERY route's metadata regardless of where it's declared (confirmed
// live: even an explicit `manifest: null` on the root layout couldn't
// override it), which would have made the marketing site and dashboard
// advertise installability into an app whose start_url/scope point at
// /m. A static file has no such auto-injection, so linking it only here
// is what actually scopes it to /m.
export const metadata: Metadata = {
  title: "ENKORE",
  description: "Built for Christian musicians. Built for His glory.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "ENKORE" },
};

export const viewport: Viewport = {
  themeColor: "#201e1d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Auth/role state is resolved ONCE here, server-side, and handed down to
// the client MobileShellProvider — Header and BottomNav both read it from
// context rather than each re-deriving it. hasMusicianProfile reuses the
// exact same OR: [{userId}, {email}] lookup the dashboard and every other
// musician-scoped page in this app already uses.
export default async function MobileLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentAppUser();
  const hasMusicianProfile = user
    ? await withCurrentUser((tx) =>
        tx.musician.findFirst({ where: { OR: [{ userId: user.id }, { email: user.email }] }, select: { id: true } }),
      ).then((m) => m != null)
    : false;

  return (
    <div className={`${archivo.variable} enkore-m flex min-h-dvh flex-col`}>
      <ServiceWorkerRegister />
      <MobileShellProvider isSignedIn={!!user} hasMusicianProfile={hasMusicianProfile}>
        <MobileHeader />
        <main className="flex-1">{children}</main>
        <MobileBottomNav />
      </MobileShellProvider>
    </div>
  );
}
