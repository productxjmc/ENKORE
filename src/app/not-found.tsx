import Link from "next/link";
import { Archivo } from "next/font/google";

// Site-wide 404 — same modernist system as the marketing homepage
// (src/app/page.tsx: Archivo type, zero-radius, #FF3700 accent, dark
// #201e1d hero). Next's App Router renders this for any unmatched route
// outside /m (which has its own not-found.tsx in the mobile design
// system instead) and for any notFound() call in a page that doesn't
// define a closer one of its own — e.g. an unknown [slug] storefront.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "700", "800", "900"],
});

const btnPrimaryLg =
  "inline-flex min-h-[54px] items-center justify-center whitespace-nowrap bg-[#FF3700] px-6 text-sm font-extrabold text-[#f3f2f2] transition-colors hover:bg-[#e02f00] active:bg-[#a82400]";

const btnGhostLg =
  "inline-flex min-h-[54px] items-center justify-center whitespace-nowrap border border-[#f3f2f2] px-6 text-sm font-extrabold text-[#f3f2f2] transition-colors hover:bg-white/10";

export default function NotFound() {
  return (
    <div className={`${archivo.className} flex min-h-dvh flex-col items-center justify-center bg-[#201e1d] px-[clamp(20px,6vw,72px)] py-20 text-center text-[#f3f2f2]`}>
      <p className="text-[clamp(11px,3vw,14px)] font-bold tracking-[.2em] text-[#FF3700] uppercase">
        Psalm 25:16
      </p>
      <p className="mt-4 max-w-[46ch] text-[clamp(14px,3.6vw,17px)] leading-[1.6] text-[#f3f2f2]/86">
        Turn to me and be gracious to me, for I am lonely and afflicted.
      </p>

      <p className="mt-14 text-[clamp(64px,18vw,140px)] font-extrabold leading-none tracking-[-.03em] text-[#FF3700]">
        404
      </p>
      <h1 className="mt-4 max-w-[20ch] text-[clamp(24px,6vw,40px)] font-extrabold uppercase leading-[1.05] tracking-[-.02em]">
        This page went quiet.
      </h1>
      <p className="mt-4 max-w-[44ch] text-[clamp(14px,3.6vw,16px)] leading-[1.6] text-[#f3f2f2]/70">
        Whatever you were looking for isn&apos;t here — the link may be old, or the page may have moved.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-[2px]">
        <Link href="/" className={btnPrimaryLg}>
          Back to home
        </Link>
        <Link href="/musician-pre-register" className={btnGhostLg}>
          Create your storefront
        </Link>
      </div>
    </div>
  );
}
