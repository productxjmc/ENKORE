import Image from "next/image";
import Link from "next/link";
import { Archivo } from "next/font/google";

// Rebuilt from the Claude Design export "ENKORE Landing Worship.dc.html"
// (Modernist design system: Archivo type, zero-radius, hairline dividers,
// #FF3700 accent). Replaces the pre-launch waitlist hero with the musician
// pitch — see chats/chat1.md in the design handoff bundle for how the
// copy and figures (85–90% take, R50k commission ceiling, US$99/yr
// subscription) were reconciled against the pitch deck.
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const STATS = [
  { value: "85–90%", label: "Of every sale stays with you" },
  { value: "R50k", label: "Then commission stops for the year" },
  { value: "40–60%", label: "Of the platform owned by musicians" },
  { value: "2014", label: "Trading with African musicians since" },
];

const FEATURES = [
  {
    n: "01",
    title: "A storefront, not a profile",
    body: "Music, merch, tickets and a Community Wall on one page at your own address. Set a price, or let people pay what they want above a floor you choose.",
  },
  {
    n: "02",
    title: "A community you actually own",
    body: "Every purchase, ticket and door scan writes a record: who, which city, how much they have given. Our goal is a thousand named supporters per musician — and if you ever leave, the records leave with you.",
  },
  {
    n: "03",
    title: "No more WhatsApp and a prayer",
    body: "A church sends the date, the venue and their budget. You reply with a fee. ENKORE generates an ECTA-compliant contract and holds the money in a Standard Bank escrow trust until you have played.",
  },
  {
    n: "04",
    title: "Merch with nothing upfront",
    body: "Printed and shipped on demand. No boxes in your bedroom, no stock to fund, no risk if a design does not sell.",
  },
];

const RAILS = [
  { name: "MTN MoMo", kind: "Mobile money" },
  { name: "M-Pesa", kind: "Mobile money" },
  { name: "Paystack", kind: "Card & bank" },
  { name: "Flutterwave", kind: "Card & bank" },
  { name: "Visa", kind: "Card" },
  { name: "Mastercard", kind: "Card" },
];

const KEEP_PER_SALE = [
  { label: "Music downloads", value: "85–90%" },
  { label: "Event tickets", value: "90%" },
  { label: "Merchandise", value: "85%" },
  { label: "Booking fees", value: "88–90%" },
];

const btnPrimaryNav =
  "inline-flex min-h-[44px] items-center whitespace-nowrap bg-[#FF3700] px-4 text-[13px] font-extrabold text-[#f3f2f2] transition-colors hover:bg-[#e02f00] active:bg-[#a82400]";

const btnPrimaryLg =
  "inline-flex min-h-[54px] flex-1 basis-[240px] items-center justify-center whitespace-nowrap bg-[#FF3700] px-4 text-sm font-extrabold text-[#f3f2f2] transition-colors hover:bg-[#e02f00] active:bg-[#a82400]";

const btnGhostLg =
  "inline-flex min-h-[54px] flex-1 basis-[240px] items-center justify-center whitespace-nowrap border border-[#f3f2f2] px-4 text-sm font-extrabold text-[#f3f2f2] transition-colors hover:bg-white/10";

export default function Home() {
  return (
    <div className={`${archivo.className} bg-[#f3f2f2] text-[#201e1d]`}>
      <header className="sticky top-0 z-30 border-b-2 border-[rgba(32,30,29,0.4)] bg-[#f3f2f2]">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3 px-[clamp(20px,5vw,72px)] py-3">
          <span className="mr-auto text-[19px] font-extrabold tracking-[-.02em]">ENKORE</span>
          <Link href="/musician-pre-register" className={btnPrimaryNav}>
            Start selling
          </Link>
        </div>
      </header>

      <section className="bg-[#201e1d]">
        <div className="relative h-[clamp(320px,48vh,520px)] w-full">
          <Image
            src="/images/worship-hero-wide.jpg"
            alt="A worship leader singing into a microphone, a raised hand in the foreground"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[58%_44%]"
          />
        </div>
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] pt-[clamp(30px,5vw,52px)] pb-[clamp(36px,6vw,60px)] text-[#f3f2f2]">
          <p className="text-[clamp(11px,3vw,14px)] font-bold tracking-[.2em] text-[#FF3700] uppercase">
            For African Christian musicians
          </p>
          <h1 className="mt-4 max-w-[17ch] text-[clamp(34px,8.4vw,72px)] leading-[1.02] font-extrabold tracking-[-.03em] uppercase">
            <span className="block">Streaming made you heard.</span>
            <span className="block text-[#FF3700]">ENKORE makes you paid.</span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-[clamp(15px,4vw,19px)] leading-[1.6] text-[#f3f2f2]/86">
            Sell your music, merch, tickets and bookings straight to your own congregation — in their currency, on
            the payment rails they actually use — and keep the record of every person who supports you.
          </p>
          <div className="mt-[30px] flex flex-wrap gap-[2px]">
            <Link href="/musician-pre-register" className={btnPrimaryLg}>
              Create your storefront
            </Link>
            <Link href="#musicians" className={btnGhostLg}>
              See what you get
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)]">
        <section aria-label="ENKORE in numbers" className="py-[clamp(28px,5vw,44px)]">
          <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-6 gap-y-7">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="text-[clamp(32px,7vw,48px)] leading-[1.1] font-extrabold text-[#FF3700]">{s.value}</p>
                <p className="mt-2.5 text-[clamp(12px,3.2vw,13px)] leading-[1.45] font-semibold tracking-[.08em] text-[#605d5d] uppercase">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        <hr className="h-[2px] border-0 bg-[rgba(32,30,29,0.4)]" />

        <section id="musicians" className="pt-[clamp(36px,6vw,52px)] pb-[clamp(24px,4vw,36px)]">
          <span className="mb-[18px] block text-[12px] leading-[1.2] font-semibold tracking-[.1em] text-[#a82400] uppercase">
            What you get
          </span>

          {FEATURES.map((f, i) => (
            <div
              key={f.n}
              className={`flex flex-col gap-3.5 py-[30px] first:pt-0 ${i > 0 ? "border-t-2 border-[rgba(32,30,29,0.4)]" : ""}`}
            >
              <div className="flex items-baseline gap-3.5">
                <span className="text-[14px] leading-[1.3] font-extrabold text-[#FF3700]">{f.n}</span>
                <h2 className="text-[clamp(21px,5.4vw,26px)] leading-[1.2] font-extrabold tracking-[-.015em]">
                  {f.title}
                </h2>
              </div>
              <p className="max-w-[56ch] text-[clamp(15px,4vw,16px)] leading-[1.75] text-[#4c4949]">{f.body}</p>
            </div>
          ))}
        </section>

        <hr className="h-[2px] border-0 bg-[rgba(32,30,29,0.4)]" />

        <section id="paying" className="py-[clamp(36px,6vw,52px)]">
          <span className="mb-[18px] block text-[12px] leading-[1.2] font-semibold tracking-[.1em] text-[#a82400] uppercase">
            Nobody is turned away at checkout
          </span>
          <h2 className="max-w-[22ch] text-[clamp(26px,7vw,42px)] leading-[1.12] font-extrabold tracking-[-.025em] uppercase">
            Priced in their own money
          </h2>
          <p className="mt-[22px] max-w-[56ch] text-[clamp(16px,4.2vw,17px)] leading-[1.7] text-[#4c4949]">
            The aunt at church without a bank card can still buy your song. Four in ten adults in sub-Saharan Africa
            hold a mobile money account — the highest rate on earth — and almost no platform selling to them can
            take it.
          </p>
          <div className="mt-[30px] grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[2px] bg-[rgba(32,30,29,0.4)] p-[2px]">
            {RAILS.map((r) => (
              <div key={r.name} className="bg-[#f3f2f2] px-5 py-[22px]">
                <p className="text-[13px] leading-[1.3] font-bold tracking-[.1em] text-[#605d5d] uppercase">
                  {r.name}
                </p>
                <p className="mt-2.5 text-[19px] leading-[1.2] font-extrabold">{r.kind}</p>
              </div>
            ))}
          </div>
          <p className="mt-5 max-w-[56ch] text-[14px] leading-[1.7] text-[#7d7979]">
            You set one price in rand. Supporters see rand, naira or cedi — never dollars.
          </p>
        </section>
      </div>

      <section className="bg-[#FF3700] text-white">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] py-[clamp(44px,7vw,72px)]">
          <p className="text-[clamp(12px,3.2vw,14px)] leading-[1.3] font-bold tracking-[.16em] text-white uppercase">
            The part no other platform will offer you
          </p>
          <h2 className="mt-5 max-w-[18ch] text-[clamp(30px,8vw,56px)] leading-[1.04] font-extrabold tracking-[-.025em] uppercase">
            You own a piece of the platform
          </h2>
          <p className="mt-6 max-w-[52ch] text-[clamp(16px,4.2vw,19px)] leading-[1.6] text-white">
            A co-operative stokvel structure puts 40–60% of ENKORE in the hands of the musicians who use it. Bandcamp
            was sold twice over the heads of its artists. A platform its musicians own cannot be.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)]">
        <section id="pricing" className="py-[clamp(36px,6vw,52px)]">
          <span className="mb-[18px] block text-[12px] leading-[1.2] font-semibold tracking-[.1em] text-[#a82400] uppercase">
            The money, plainly
          </span>
          <h2 className="max-w-[22ch] text-[clamp(26px,7vw,42px)] leading-[1.12] font-extrabold tracking-[-.025em] uppercase">
            One subscription, and a commission with a ceiling
          </h2>
          <div className="mt-[30px] grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-[2px] bg-[rgba(32,30,29,0.4)] p-[2px]">
            <div className="bg-[#f3f2f2] px-6 py-[26px]">
              <p className="text-[13px] leading-[1.3] font-bold tracking-[.1em] text-[#605d5d] uppercase">
                Your subscription
              </p>
              <p className="mt-3.5 text-[clamp(28px,7vw,38px)] leading-none font-extrabold text-[#FF3700]">
                US$99<span className="text-[18px] leading-none font-bold text-[#201e1d]"> a year</span>
              </p>
              <p className="mt-3.5 text-[15px] leading-[1.7] text-[#4c4949]">
                About R150 a month, paid in installments you choose to pay. Nothing is ever charged automatically.
              </p>
            </div>
            <div className="bg-[#f3f2f2] px-6 py-[26px]">
              <p className="text-[13px] leading-[1.3] font-bold tracking-[.1em] text-[#605d5d] uppercase">
                What you keep per sale
              </p>
              <div className="mt-3.5">
                {KEEP_PER_SALE.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between border-t border-[#d7d3d3] py-[11px]"
                  >
                    <span className="text-[15px] leading-[1.4]">{row.label}</span>
                    <span className="text-[16px] leading-none font-bold">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-2 border-[#FF3700] bg-[#f3f2f2] px-6 py-[26px]">
              <p className="text-[13px] leading-[1.3] font-bold tracking-[.1em] text-[#a82400] uppercase">
                The ceiling
              </p>
              <p className="mt-3.5 text-[clamp(28px,7vw,38px)] leading-none font-extrabold text-[#FF3700]">
                R50,000
              </p>
              <p className="mt-3.5 text-[15px] leading-[1.7] text-[#4c4949]">
                Once ENKORE has taken R50,000 in commission in a rolling year, it takes nothing more until the year
                resets. Written into the architecture, not the marketing.
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-[56ch] text-[14px] leading-[1.7] text-[#7d7979]">
            Registered as a worship team, the ceiling is R100,000. Your storefront stays live seven days past a due
            date.
          </p>
        </section>

        <hr className="h-[2px] border-0 bg-[rgba(32,30,29,0.4)]" />

        <section className="py-[clamp(36px,6vw,52px)]">
          <figure className="m-0">
            <blockquote className="max-w-[30ch] text-[clamp(21px,5.6vw,32px)] leading-[1.28] font-extrabold tracking-[-.02em]">
              “I sold more at one church service than in a year of streaming. And I know every person who bought.”
            </blockquote>
            <figcaption className="mt-[26px] text-[15px] leading-[1.7] text-[#605d5d]">
              — Thandi Mokoena, worship leader, Soweto
            </figcaption>
          </figure>
        </section>
      </div>

      <section id="start" className="bg-[#201e1d] text-[#f3f2f2]">
        <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)] py-[clamp(44px,7vw,72px)]">
          <p className="text-[clamp(12px,3.2vw,14px)] leading-[1.3] font-bold tracking-[.16em] text-[#FF3700] uppercase">
            Getting started
          </p>
          <h3 className="mt-5 max-w-[18ch] text-[clamp(30px,8vw,56px)] leading-[1.04] font-extrabold tracking-[-.025em] uppercase">
            Three documents and a photograph
          </h3>
          <p className="mt-6 max-w-[50ch] text-[clamp(16px,4.2vw,19px)] leading-[1.6] text-[#f3f2f2]/82">
            Your ID, a bank confirmation letter and a press photo. A person reviews them in 7 to 21 working
            days — then your storefront is live at enkoremusic.africa/your-name.
          </p>
          <div className="mt-8 flex flex-wrap gap-[2px]">
            <Link href="/musician-pre-register" className={btnPrimaryLg.replace("basis-[240px]", "basis-[260px]")}>
              Create your storefront
            </Link>
            <Link href="#musicians" className={btnGhostLg.replace("basis-[240px]", "basis-[260px]")}>
              See what you get
            </Link>
          </div>
          <p className="mt-7 text-[clamp(12px,3.2vw,14px)] leading-[1.4] font-semibold tracking-[.1em] text-[#FF3700] uppercase">
            Built for Christian musicians · Built for His glory
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-[clamp(20px,5vw,72px)]">
        <footer className="py-9 text-[13px] leading-[1.75] text-[#605d5d]">
          ENKORE · Fanbase Africa (Pty) Ltd · enkoremusic.africa · B-BBEE Level 1 · POPIA compliant
        </footer>
      </div>
    </div>
  );
}
