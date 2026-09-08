// Musician Studio — the real earnings/roadmap dashboard is Phase 4. This
// exists now so Phase 1's role switch has somewhere real to land instead
// of a 404 (the toggle itself, and the has-musician-profile gate, are
// genuinely Phase 1 work; the Studio content behind it isn't).
export default function MobileMusicianDashPage() {
  return (
    <div className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: "var(--m-accent)" }}>
        Musician
      </p>
      <h1 className="mt-2 text-[24px] font-extrabold uppercase leading-[1.02] tracking-[-0.025em]">Studio</h1>
      <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>
        Earnings, the growth roadmap, and payouts ship in Phase 4.
      </p>
    </div>
  );
}
