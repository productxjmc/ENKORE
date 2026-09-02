import { Users, Church, Crown, ArrowRight, Loader2 } from "lucide-react";

const TIERS = [
  {
    key: "community",
    name: "Community Partner",
    icon: Users,
    reward: "R200 per signup",
    description: "Share your link with musicians in your network. Earn R200 for every musician who joins and pays.",
    requirement: "Open to everyone",
    highlight: false,
  },
  {
    key: "ministry",
    name: "Ministry Partner",
    icon: Church,
    reward: "R200 + R1,000 Church Multiplier",
    description:
      "For worship leaders and music directors. Earn R200 per signup PLUS a R1,000 Ministry Blessing for every musician you onboard from your congregation.",
    requirement: "Ministry role verification",
    highlight: true,
  },
  {
    key: "ambassador",
    name: "Ambassador",
    icon: Crown,
    reward: "R200 + R30/mo residual + Multiplier",
    description:
      "Our highest tier. Earn R200 per signup, the R1,000 Church Multiplier, AND R30/month residual for every active musician — for life.",
    requirement: "Invitation & application only",
    highlight: false,
  },
] as const;

// Ported from the Base44 app's src/components/partner/PartnerTierCards.jsx.
export default function PartnerTierCards({
  onActivate,
  activating,
  onApplyMinistry,
}: {
  onActivate: () => void;
  activating: boolean;
  onApplyMinistry: () => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {TIERS.map((tier) => {
        const Icon = tier.icon;
        return (
          <div
            key={tier.key}
            className={`rounded-2xl p-6 border ${
              tier.highlight ? "bg-[#FF3700]/10 border-[#FF3700]/30" : "bg-[#141414] border-white/7"
            }`}
          >
            <Icon className={`w-6 h-6 mb-4 ${tier.highlight ? "text-[#FF3700]" : "text-white/50"}`} />
            <h3 className="text-lg font-black text-white mb-1">{tier.name}</h3>
            <p className={`text-sm font-bold mb-3 ${tier.highlight ? "text-[#FF3700]" : "text-white/70"}`}>{tier.reward}</p>
            <p className="text-white/45 text-xs leading-relaxed mb-4">{tier.description}</p>
            <div className="pt-4 border-t border-white/7">
              <p className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/30 mb-3">{tier.requirement}</p>
              {tier.key === "community" ? (
                <button
                  type="button"
                  onClick={onActivate}
                  disabled={activating}
                  className="w-full flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] disabled:opacity-60 text-white font-bold text-sm rounded-full py-3 transition-colors"
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Activating…
                    </>
                  ) : (
                    <>
                      Activate <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : tier.key === "ministry" ? (
                <button
                  type="button"
                  onClick={onApplyMinistry}
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-full py-3 transition-colors"
                >
                  Apply <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <a
                  href="mailto:partners@fanbaseafrica.co.za?subject=Ambassador%20Application"
                  className="w-full flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm rounded-full py-3 transition-colors"
                >
                  Request Invite <ArrowRight className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
