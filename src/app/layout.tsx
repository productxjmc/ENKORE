import type { Metadata } from "next";
import { Geist, Geist_Mono, Roboto } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ported design token from the Base44 app's src/index.css, which loaded
// this via a raw `@import url(fonts.googleapis.com/...)` in CSS — that
// breaks Tailwind v4's CSS import ordering rules once other @import
// statements are appended after it, so next/font/google is used instead
// (also self-hosts the font, which is strictly better for performance).
const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkoremusic.online";
const SITE_TITLE = "ENKORE — Built for Christian Musicians";
const SITE_DESCRIPTION = "Sell your music, merch, tickets and bookings straight to your own congregation — in their currency, on the payment rails they actually use.";

// Root-level defaults every page inherits unless it sets its own (most
// pages still don't — see the [slug] storefront's own generateMetadata
// for the one place that does today). Without this, a page with no
// metadata of its own had literally nothing for Open Graph/Twitter to
// show when shared — confirmed there were zero openGraph/twitter
// fields anywhere in the app before this.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: "%s | ENKORE" },
  description: SITE_DESCRIPTION,
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "ENKORE",
    images: [{ url: "/images/worship-hero-wide.jpg" }],
    locale: "en_ZA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/images/worship-hero-wide.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} ${roboto.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col">{children}</body>
      </html>
    </ClerkProvider>
  );
}
