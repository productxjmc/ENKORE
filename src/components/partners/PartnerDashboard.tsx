"use client";

import { useState } from "react";
import Link from "next/link";
import type { Affiliate } from "@prisma/client";
import { Copy, Check, Users, TrendingUp, DollarSign, ArrowLeft, Share2, ExternalLink, Crown, Church, Award } from "lucide-react";
import { motion } from "framer-motion";
import FoundingPartnerCounter from "@/components/partners/FoundingPartnerCounter";
import PartnerTierCards from "@/components/partners/PartnerTierCards";
import MinistryApplicationForm, { type MinistryFormData } from "@/components/partners/MinistryApplicationForm";

// Decimal fields become plain numbers after page.tsx's toPlain() — see
// src/lib/serialize.ts, same pattern as Storefront's PlainMusician/PlainTrack.
export type PlainAffiliate = Omit<
  Affiliate,
  "pendingEarnings" | "totalEarningsPaid" | "residualEarnings" | "upfrontBonusEarned" | "churchMultiplierEarned" | "commissionPerConversion"
> & {
  pendingEarnings: number;
  totalEarningsPaid: number;
  residualEarnings: number;
  upfrontBonusEarned: number;
  churchMultiplierEarned: number;
  commissionPerConversion: number;
};

const TIER_LABELS: Record<string, string> = {
  COMMUNITY: "Community Partner",
  MINISTRY: "Ministry Partner",
  AMBASSADOR: "Ambassador",
};

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkore.co.za";

function StatCard({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#141414] border border-white/7 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4 text-[#FF3700]" />
        <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-white/40">{label}</span>
      </div>
      <p className="text-3xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </div>
  );
}

// Ported from the Base44 app's src/pages/AffiliateDashboard.jsx. Server
// page.tsx already resolved the signed-in user and their own Affiliate
// row (or null) — this component is purely the interactive shell around
// that, unlike the source which fetched both client-side after mount.
export default function PartnerDashboard({ affiliate: initialAffiliate }: { affiliate: PlainAffiliate | null }) {
  const [affiliate, setAffiliate] = useState<PlainAffiliate | null>(initialAffiliate);
  const [activating, setActivating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMinistryForm, setShowMinistryForm] = useState(false);

  const activate = async () => {
    setActivating(true);
    try {
      const res = await fetch("/api/partners/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const out = await res.json();
      if (out?.affiliate) setAffiliate(out.affiliate);
    } catch {
      // swallow — activating stays false, button re-enables, user can retry
    }
    setActivating(false);
  };

  const submitMinistryApplication = async (data: MinistryFormData) => {
    try {
      const res = await fetch("/api/partners/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: affiliate ? "ministry_upgrade" : "activate",
          ministry: { ministryName: data.ministryName, ministryRole: data.ministryRole, message: data.message },
        }),
      });
      const out = await res.json();
      if (out?.affiliate) setAffiliate(out.affiliate);
    } catch {
      // swallow — form stays closed either way below, matching the source
    }
    setShowMinistryForm(false);
  };

  const referralLink = affiliate ? `${APP_URL}/musician-pre-register?ref=${affiliate.referralCode}` : "";

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: "Join ENKORE — Ministry-First Music Platform",
        text: "I just joined ENKORE, the platform empowering African Christian musicians. Join the founding community:",
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const tierLabel = affiliate ? TIER_LABELS[affiliate.tier] ?? "Community Partner" : "";
  const isFounding = affiliate?.foundingMember;

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-5">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/40 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors py-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <div className="max-w-4xl mx-auto px-5 pb-24">
        <motion.div className="pb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center gap-2 mb-5">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="7.5" y="1" width="3" height="16" rx="1" fill="#FF3700" />
              <rect x="1" y="6.5" width="16" height="3" rx="1" fill="#FF3700" />
            </svg>
            <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-[#FF3700]">ENKORE Partner Program</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black leading-[0.95] tracking-tight mb-4">
            Equip Ministries.
            <br />
            <span className="text-[#FF3700]">Earn Rewards.</span>
          </h1>
          <p className="text-white/60 text-base leading-relaxed max-w-xl">
            Every musician you bring to ENKORE is a ministry you help equip. Share your unique link — when a musician
            joins and pays, you earn rewards.
          </p>
        </motion.div>

        {!affiliate ? (
          <div className="space-y-6">
            <FoundingPartnerCounter />
            <PartnerTierCards onActivate={activate} activating={activating} onApplyMinistry={() => setShowMinistryForm(true)} />
            {showMinistryForm && (
              <MinistryApplicationForm onSubmit={submitMinistryApplication} onCancel={() => setShowMinistryForm(false)} />
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/25 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-green-400 text-xs font-bold tracking-widest uppercase">{tierLabel}</span>
              </div>
              {isFounding && (
                <div className="inline-flex items-center gap-1.5 bg-[#FF3700]/15 border border-[#FF3700]/30 rounded-full px-4 py-2">
                  <Crown className="w-3.5 h-3.5 text-[#FF3700]" />
                  <span className="text-[#FF3700] text-xs font-bold tracking-widest uppercase">Founding Partner</span>
                </div>
              )}
              {affiliate.verificationStatus === "PENDING" && (
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/25 rounded-full px-4 py-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                  <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase">Upgrade Pending</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}>
                <StatCard icon={Users} label="Clicks" value={affiliate.clicks} sub="Link visits" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
                <StatCard icon={TrendingUp} label="Conversions" value={affiliate.conversions} sub="Confirmed signups" />
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}>
                <StatCard
                  icon={DollarSign}
                  label="Pending Earnings"
                  value={`R${affiliate.pendingEarnings.toLocaleString()}`}
                  sub={`R${affiliate.totalEarningsPaid.toLocaleString()} paid to date`}
                />
              </motion.div>
            </div>

            {affiliate.tier === "AMBASSADOR" && (
              <StatCard icon={Award} label="Residual Earnings" value={`R${affiliate.residualEarnings.toLocaleString()}`} sub="Monthly active musician residuals" />
            )}
            {(affiliate.tier === "MINISTRY" || affiliate.tier === "AMBASSADOR") && (
              <StatCard icon={Church} label="Church Multiplier Earned" value={`R${affiliate.churchMultiplierEarned.toLocaleString()}`} sub="R1,000 ministry blessings" />
            )}

            <motion.div
              className="bg-[#141414] border border-white/7 rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70 mb-3">Your Partner Link</p>
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-xl px-4 py-3 mb-3">
                <ExternalLink className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <p className="text-sm text-white/60 truncate flex-1 font-mono">{referralLink}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={copyLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl py-3 text-sm font-semibold text-white transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-400" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copy Link
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={shareLink}
                  className="flex-1 flex items-center justify-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] rounded-xl py-3 text-sm font-bold text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" /> Share Now
                </button>
              </div>
            </motion.div>

            <motion.div
              className="bg-[#141414] border border-white/7 rounded-2xl p-5"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70 mb-1">Your Referral Code</p>
              <p className="text-white/40 text-xs mb-3">Musicians can also enter this code manually on the registration form.</p>
              <div className="inline-flex items-center gap-3 bg-black/60 border border-[#FF3700]/20 rounded-xl px-5 py-3">
                <span className="text-2xl font-black text-[#FF3700] tracking-widest font-mono">{affiliate.referralCode}</span>
              </div>
            </motion.div>

            {affiliate.tier === "COMMUNITY" && affiliate.verificationStatus === "NOT_SUBMITTED" && (
              <div className="bg-[#141414] border border-[#FF3700]/20 rounded-2xl p-5">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70 mb-2">Upgrade Your Tier</p>
                <p className="text-white/55 text-sm leading-relaxed mb-4">
                  Lead a ministry? Upgrade to <strong className="text-white">Ministry Partner</strong> and earn a{" "}
                  <strong className="text-[#FF3700]">R1,000 Church Multiplier</strong> for every musician you onboard from
                  your congregation.
                </p>
                <button type="button" onClick={() => setShowMinistryForm(true)} className="text-sm font-bold text-[#FF3700] hover:text-[#CC2E00] transition-colors">
                  Apply for Ministry Tier →
                </button>
              </div>
            )}

            {showMinistryForm && (
              <MinistryApplicationForm existing={affiliate} onSubmit={submitMinistryApplication} onCancel={() => setShowMinistryForm(false)} />
            )}

            <div className="bg-[#141414] border border-white/7 rounded-2xl p-5">
              <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#FF3700]/70 mb-3">Payout</p>
              <p className="text-white/55 text-sm leading-relaxed">
                Payouts begin at program launch. Reach <strong className="text-white">R500</strong> in pending earnings to
                request a payout via bank transfer, PayFast, or mobile money.
              </p>
              <p className="text-white/35 text-xs mt-2">Commissions are subject to a 60-day clawback period from the musician&apos;s first payment.</p>
            </div>
          </div>
        )}

        <div className="mt-10 text-center">
          <p className="text-white/25 text-sm">&quot;Let us not grow weary of doing good, for in due season we will reap.&quot;</p>
          <cite className="not-italic text-[10px] font-bold tracking-widest text-[#FF3700]/40 mt-1 block">Galatians 6:9</cite>
        </div>
      </div>
    </div>
  );
}
