import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import ServiceWorkerRegister from "@/components/mobile/ServiceWorkerRegister";
import MobileHeader from "@/components/mobile/MobileHeader";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
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

// Phase 0: shell + PWA registration + a fixed Member nav, proven end to
// end. Phase 1 adds real identity (sign in/up) and swaps the header's
// static role badge + MobileBottomNav's fixed item set for the actual
// signed-in role.
export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${archivo.variable} enkore-m flex min-h-dvh flex-col`}>
      <ServiceWorkerRegister />
      <MobileHeader />
      <main className="flex-1">{children}</main>
      <MobileBottomNav />
    </div>
  );
}
