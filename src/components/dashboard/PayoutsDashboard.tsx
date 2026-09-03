"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Wallet, DollarSign, Clock, TrendingUp, Shield, Receipt, ArrowUpRight, ArrowDownLeft, Loader2, Calendar, Banknote } from "lucide-react";

export type PayoutsData = {
  musicianName: string;
  stats: { grossRevenue: number; totalCommission: number; netEarnings: number; totalPaidOut: number; pendingPayouts: number; availableBalance: number };
  plan: { name: string; commissionRate: number; payoutFrequency: string };
  payoutInfo: { bankName: string; accountNumber: string };
  transactions: { id: string; type: "sale" | "payout"; title: string; date: string | Date; gross: number; commission: number; net: number; status: string; reference: string | null }[];
};

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
};

function StatCard({ icon: Icon, iconColor, label, value, sub }: { icon: typeof Wallet; iconColor: string; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 uppercase">{label}</p>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

// Ported from the Base44 app's src/pages/Payouts.jsx — the commission-cap
// banner is deliberately not ported (see page.tsx's comment). The bank
// details card at the bottom is new: the source never had a way to
// actually set bank info, only referenced it.
export default function PayoutsDashboard({ data }: { data: PayoutsData }) {
  const { musicianName, stats, plan, transactions } = data;
  const [bankName, setBankName] = useState(data.payoutInfo.bankName);
  const [accountNumber, setAccountNumber] = useState(data.payoutInfo.accountNumber);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  const saveBankDetails = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/musician/payout-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bankName, accountNumber }),
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: "Failed to save bank details" });
        return;
      }
      setMessage({ kind: "success", text: "Bank details saved" });
    } catch {
      setMessage({ kind: "error", text: "Failed to save bank details" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <div className="text-right">
            <p className="font-semibold text-gray-900 text-sm">{musicianName}</p>
            <p className="text-xs text-gray-500">Payouts &amp; Earnings</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8 space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Payouts &amp; Earnings</h1>
          <p className="text-sm text-gray-500">Track your revenue and pending payouts.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Wallet} iconColor="text-green-600" label="Net Earnings" value={`R ${Math.round(stats.netEarnings).toLocaleString()}`} sub="All-time, after fees" />
          <StatCard
            icon={DollarSign}
            iconColor="text-orange-500"
            label="Available Balance"
            value={`R ${Math.round(stats.availableBalance).toLocaleString()}`}
            sub="Ready for next payout"
          />
          <StatCard icon={Clock} iconColor="text-yellow-600" label="Pending Payouts" value={`R ${Math.round(stats.pendingPayouts).toLocaleString()}`} sub="Processing / scheduled" />
          <StatCard icon={TrendingUp} iconColor="text-blue-600" label="Total Paid Out" value={`R ${Math.round(stats.totalPaidOut).toLocaleString()}`} sub="All-time settled" />
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900 text-sm">Your Commission Plan</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Plan</p>
              <p className="font-semibold text-gray-900">{plan.name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Sales Commission</p>
              <p className="font-semibold text-gray-900">{plan.commissionRate}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase mb-1">Payout Frequency</p>
              <p className="font-semibold text-gray-900 capitalize">{plan.payoutFrequency.replace("_", "-").toLowerCase()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Banknote className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900 text-sm">Bank Details</h3>
          </div>
          {message && (
            <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${message.kind === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{message.text}</div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Bank Name</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                placeholder="e.g. Standard Bank"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Account Number</label>
              <input
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                placeholder="Account number"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={saveBankDetails}
            disabled={saving}
            className="mt-4 inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Bank Details"}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Receipt className="w-4 h-4 text-orange-500" />
            <h3 className="font-bold text-gray-900 text-sm">Transaction History</h3>
          </div>
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <Receipt className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No transactions yet</p>
              <p className="text-gray-400 text-xs mt-1">Your sales and payouts will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {transactions.map((tx) => {
                const isPayout = tx.type === "payout";
                const statusColor = STATUS_COLORS[tx.status] || "bg-gray-100 text-gray-700";
                return (
                  <div key={tx.id} className="flex items-center gap-3 py-3">
                    <div className={`p-2 rounded-full ${isPayout ? "bg-blue-100" : "bg-orange-100"}`}>
                      {isPayout ? <ArrowUpRight className="w-4 h-4 text-blue-600" /> : <ArrowDownLeft className="w-4 h-4 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 truncate">{tx.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                        {tx.reference && ` · Ref: ${tx.reference}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-semibold text-sm text-gray-900">
                        {isPayout ? "+ " : ""}R {Math.round(tx.net).toLocaleString()}
                      </p>
                      {!isPayout && tx.commission > 0 && <p className="text-xs text-gray-400">fee R{Math.round(tx.commission).toLocaleString()}</p>}
                      <span className={`inline-block ${statusColor} text-[10px] font-semibold rounded-full px-2 py-0.5 mt-0.5`}>{tx.status}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Payouts processed on your plan&apos;s schedule.</span>
        </div>
      </main>
    </div>
  );
}
