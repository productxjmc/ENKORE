import BecomePartnerButton from "@/components/mobile/BecomePartnerButton";

// Same "tap it without a profile, get the pitch" pattern as
// /m/musician/why — except becoming a partner is instant (POST
// /api/partners/activate, same route the desktop /partners page
// already uses), not a reviewed application.
export default function PartnerWhyPage() {
  return (
    <div>
      <div className="px-4 pb-6 pt-6 text-white" style={{ background: "var(--m-ink)" }}>
        <p className="m-0 text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: "var(--m-accent)" }}>
          Equip ministries. Earn rewards.
        </p>
        <h1 className="mt-2 text-[28px] font-extrabold uppercase leading-[0.98] tracking-[-0.025em]">
          Bring musicians in. Get paid for it.
        </h1>
        <p className="mt-3 text-[14px] leading-[1.5]" style={{ color: "rgba(243,242,242,.86)" }}>
          Every musician you bring to ENKORE is a ministry you help equip. Share your unique link — when a musician joins and pays, you earn rewards.
        </p>
      </div>

      <div className="flex flex-col divide-y-2" style={{ borderColor: "var(--m-line)" }}>
        {[
          ["Community Partner", "Your own referral link and code, free to activate."],
          ["Ministry Partner", "Lead a ministry? Earn a R1,000 Church Multiplier per musician you onboard."],
          ["A real payout", "Reach R500 in pending earnings and request a payout — bank transfer, PayFast, or mobile money."],
        ].map(([title, body]) => (
          <div key={title} className="px-4 py-4">
            <p className="text-[15px] font-extrabold">{title}</p>
            <p className="mt-1 text-[13px]" style={{ color: "var(--m-text-muted)" }}>{body}</p>
          </div>
        ))}
      </div>

      <div className="p-4">
        <BecomePartnerButton />
      </div>
    </div>
  );
}
