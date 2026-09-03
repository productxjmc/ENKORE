"use client";

import Link from "next/link";
import type { Musician, Track } from "@prisma/client";
import { DollarSign, Music, Users, Download, Eye, Clock, CheckCircle, XCircle } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import RecentActivity, { type ActivityItem } from "@/components/dashboard/RecentActivity";
import TopTracks from "@/components/dashboard/TopTracks";
import SalesBreakdown from "@/components/dashboard/SalesBreakdown";

// Decimal fields become plain numbers after page.tsx's toPlain() — see
// src/lib/serialize.ts, same pattern as PartnerDashboard's PlainAffiliate.
export type PlainMusician = Omit<Musician, "totalRevenue"> & { totalRevenue: number };
export type PlainTrack = Omit<Track, "basePrice" | "minimumPrice" | "revenueGenerated"> & {
  basePrice: number | null;
  minimumPrice: number;
  revenueGenerated: number;
};

export type DashboardData = {
  musician: PlainMusician;
  tracks: PlainTrack[];
  stats: {
    totalRevenue: number;
    totalTracks: number;
    totalFollowers: number;
    totalDownloads: number;
    revenueTrend: number | null;
    thisWeekFollows: number;
    thisWeekDownloads: number;
  };
  salesBreakdown: { thisWeekRevenue: number; lastWeekRevenue: number; allTimeRevenue: number; allTimeSales: number };
  recentActivity: ActivityItem[];
};

// Ported from the Base44 app's src/pages/MusicianDashboard.jsx — this
// phase (dashboard shell) only. Every later phase (goals, bookings, merch,
// events, subscription, launch toggle, etc.) grafts its own section onto
// this shell rather than this file growing to match the ~500-line source
// in one commit. Light functional admin style (bg-gray-50/white cards),
// a deliberate departure from the dark brand used on /partners and the
// storefront — see the plan's locked design decision.
export default function MusicianDashboardShell({ data }: { data: DashboardData }) {
  const { musician, tracks, stats, salesBreakdown, recentActivity } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-bold text-gray-900">{musician.musicianName}</p>
            {musician.storefrontUrl && <p className="text-xs text-gray-500">enkore.co.za/{musician.storefrontUrl}</p>}
          </div>
          {musician.storefrontUrl && (
            <Link
              href={`/${musician.storefrontUrl}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-full px-4 py-2 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Preview Storefront
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Welcome back, {musician.musicianName}</h1>
          <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your music today.</p>
        </div>

        {musician.requirementsStatus === "PENDING_REVIEW" && (
          <div className="mb-6 flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
            <Clock className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-yellow-800 text-sm">Profile under review</p>
              <p className="text-sm text-yellow-700">Our team is reviewing your submitted documents. You&apos;ll hear from us within 2–3 business days.</p>
            </div>
          </div>
        )}
        {musician.requirementsStatus === "CHANGES_REQUESTED" && (
          <div className="mb-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-red-800 text-sm">Changes requested</p>
              <p className="text-sm text-red-700">{musician.requirementsNotes || "Please review and resubmit your documents."}</p>
            </div>
          </div>
        )}
        {musician.requirementsStatus === "APPROVED" && musician.onboardingStep !== "LAUNCHED" && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-green-800 text-sm">Profile approved</p>
              <p className="text-sm text-green-700">Your documents have been approved.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
          <StatsCard
            title="Total Revenue"
            value={`R ${stats.totalRevenue.toLocaleString()}`}
            icon={DollarSign}
            trend={stats.revenueTrend != null ? (stats.revenueTrend >= 0 ? "up" : "down") : null}
            trendValue={stats.revenueTrend != null ? `${stats.revenueTrend >= 0 ? "+" : ""}${stats.revenueTrend.toFixed(1)}%` : null}
            subtitle="Net earnings after fees"
          />
          <StatsCard title="Total Tracks" value={stats.totalTracks} icon={Music} />
          <StatsCard
            title="Followers"
            value={stats.totalFollowers}
            icon={Users}
            trend={stats.thisWeekFollows > 0 ? "up" : null}
            trendValue={stats.thisWeekFollows > 0 ? `+${stats.thisWeekFollows} this week` : null}
          />
          <StatsCard
            title="Downloads"
            value={stats.totalDownloads}
            icon={Download}
            trend={stats.thisWeekDownloads > 0 ? "up" : null}
            trendValue={stats.thisWeekDownloads > 0 ? `+${stats.thisWeekDownloads} this week` : null}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          <div className="lg:col-span-1">
            <SalesBreakdown breakdown={salesBreakdown} />
          </div>
          <div className="lg:col-span-1">
            <TopTracks tracks={tracks} />
          </div>
          <div className="lg:col-span-1">
            <RecentActivity activities={recentActivity} />
          </div>
        </div>
      </main>
    </div>
  );
}
