import Link from "next/link";

// "Tap it without a musician profile and you get the pitch, not a dead
// end" — per the design. Applying is the existing musician-pre-register
// flow (review/approval already built); this screen doesn't duplicate it.
export default function MusicianWhyPage() {
  return (
    <div>
      <div className="px-4 pb-6 pt-6 text-white" style={{ background: "var(--m-ink)" }}>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--m-accent)" }}>
          For musicians &amp; worship teams
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">
          Your music. Your fans. Your income.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.5]" style={{ color: "rgba(243,242,242,.86)" }}>
          Sell your music at a price you set, list merch with zero upfront cost, take bookings without WhatsApp, and
          build a fan database you own — permanently.
        </p>
      </div>

      <div className="flex flex-col divide-y-2" style={{ borderColor: "var(--m-line)" }}>
        {[
          ["Sell music your way", "Fixed price, pay-what-you-want, or free — you choose."],
          ["Zero-risk merch", "Print-on-demand. No stock, no upfront cost."],
          ["Bookings without WhatsApp", "Churches and promoters request, you quote, you confirm."],
          ["A fan database you own", "Every purchase, ticket, and door scan builds it — yours if you ever leave."],
        ].map(([title, body]) => (
          <div key={title} className="px-4 py-4">
            <p className="text-[15px] font-extrabold">{title}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{body}</p>
          </div>
        ))}
      </div>

      <div className="p-4">
        <Link
          href="/musician-pre-register"
          className="flex min-h-[52px] w-full items-center justify-center text-[13px] font-bold text-white"
          style={{ background: "var(--m-accent)" }}
        >
          Apply as a musician
        </Link>
        <p className="mt-3 text-center text-[11px]" style={{ color: "var(--m-text-faint)" }}>
          Applications are reviewed within 7–21 working days.
        </p>
      </div>
    </div>
  );
}
