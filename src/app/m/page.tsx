// Phase 0 placeholder — proves the shell (header, nav, PWA registration,
// design tokens) renders correctly end to end. The scripture band below is
// static content straight from the design and is genuinely final; the rest
// of the home feed (today's tickets/releases, musicians near you) is real
// data work that lands in Phase 2, not stubbed here.
export default function MobileHomePage() {
  return (
    <div>
      <div className="px-4 pb-[22px] pt-5 text-white" style={{ background: "var(--m-ink)" }}>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--m-accent)" }}>
          1 Corinthians 10:31
        </p>
        <p className="mt-2 text-[15px] leading-[1.45]" style={{ color: "rgba(243,242,242,.86)" }}>
          So whether you eat or drink or whatever you do, do it all for the glory of God.
        </p>
        <p className="mt-[18px] text-[30px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">
          Built for Christian musicians. Built for His glory.
        </p>
      </div>

      <div className="p-4">
        <p className="text-sm" style={{ color: "var(--m-text-muted)" }}>
          The rest of Home — today&apos;s tickets and releases, musicians near you — ships in Phase 2.
        </p>
      </div>
    </div>
  );
}
