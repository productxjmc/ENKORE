"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Rocket, Music, Wallet, Users, TrendingUp } from "lucide-react";

export type GrowthRoadmapData = {
  requirementsApproved: boolean;
  payoutComplete: boolean;
  tracksCount: number;
  isLive: boolean;
  followersCount: number;
  salesCount: number;
};

// Ported from the Base44 app's src/components/dashboard/GrowthRoadmap.jsx —
// the "list a merchandise item" step is deliberately not included yet:
// merch management doesn't exist in this rebuild until a later phase, and
// this app avoids linking to pages that don't exist. Add it back once
// that phase lands. Links are real hrefs (Next's Link) rather than the
// source's navigate() callbacks — same information, more idiomatic here.
export default function GrowthRoadmap({ data }: { data: GrowthRoadmapData }) {
  const steps = [
    { key: "requirements", label: "Submit profile requirements", done: data.requirementsApproved, href: "/dashboard/onboarding", icon: Rocket },
    { key: "payouts", label: "Add your bank & payout details", done: data.payoutComplete, href: "/dashboard/payouts", icon: Wallet },
    { key: "tracks", label: "Upload your first track", done: data.tracksCount > 0, href: "/dashboard/upload-track", icon: Music },
    { key: "live", label: "Launch your storefront (go live)", done: data.isLive, href: "/dashboard", icon: Rocket },
    { key: "fans", label: "Get your first 5 followers", done: data.followersCount >= 5, href: "/dashboard", icon: Users },
    { key: "sales", label: "Make your first sale", done: data.salesCount > 0, href: "/dashboard", icon: TrendingUp },
  ];

  const completed = steps.filter((s) => s.done).length;
  const percent = Math.round((completed / steps.length) * 100);
  const nextStep = steps.find((s) => !s.done);
  const circumference = 2 * Math.PI * 20;

  return (
    <div className="bg-gradient-to-br from-orange-50 to-white border border-orange-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 text-base">Growth Roadmap</h3>
          <p className="text-sm text-gray-500">
            {completed} of {steps.length} steps complete · {percent}% ready
          </p>
        </div>
        <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
          <svg className="absolute inset-0 -rotate-90" width="48" height="48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" strokeWidth="4" />
            <circle
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#FF3700"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - percent / 100)}
              strokeLinecap="round"
            />
          </svg>
          <span className="text-sm font-bold text-orange-600">{percent}%</span>
        </div>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-4">
        <div className="h-full bg-orange-500 rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
      </div>

      {nextStep && (
        <Link href={nextStep.href} className="flex items-center justify-between bg-white rounded-lg border border-orange-200 p-3 mb-3 hover:border-orange-300 transition-colors">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0">
              <nextStep.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Next step</p>
              <p className="text-sm font-medium text-gray-900">{nextStep.label}</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-orange-600 shrink-0">
            Go <ArrowRight className="w-4 h-4" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {steps.map((s) => (
          <div key={s.key} className="flex items-center gap-2 text-sm">
            {s.done ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> : <Circle className="w-4 h-4 text-gray-300 shrink-0" />}
            <span className={s.done ? "text-gray-400 line-through" : "text-gray-700"}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
