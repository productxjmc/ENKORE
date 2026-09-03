"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Package, Truck, CheckCircle2, Clock, MapPin, ShoppingBag, XCircle, Loader2, Box, CheckSquare, Square, Layers, RefreshCw } from "lucide-react";

export type PlainMerchOrder = {
  id: string;
  merchandiseId: string;
  itemName: string;
  itemImageUrl: string | null;
  quantity: number;
  size: string | null;
  totalAmount: number;
  fanName: string | null;
  fanEmail: string | null;
  shippingAddress: Record<string, string>;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  trackingNumber: string | null;
  createdAt: string | Date;
};

const PRODUCTION_STATUSES = ["PENDING", "PROCESSING"];
const SHIPPING_STATUSES = ["SHIPPED", "DELIVERED"];
const FLOW = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"] as const;
const FLOW_LABELS: Record<string, string> = { PENDING: "Pending", PROCESSING: "In Production", SHIPPED: "Shipped", DELIVERED: "Delivered", CANCELLED: "Cancelled" };
const FLOW_ICONS = [Clock, Loader2, Truck, CheckCircle2];

function StatusPipeline({ status }: { status: string }) {
  if (status === "CANCELLED") {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-100 text-red-700 border border-red-200 text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" /> Cancelled
      </div>
    );
  }
  const currentIdx = FLOW.indexOf(status as (typeof FLOW)[number]);
  return (
    <div className="flex items-center w-full">
      {FLOW.map((step, idx) => {
        const done = idx < currentIdx;
        const active = idx === currentIdx;
        const Icon = FLOW_ICONS[idx];
        return (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${done ? "bg-green-500 border-green-500 text-white" : active ? "bg-orange-500 border-orange-500 text-white" : "bg-gray-100 border-gray-200 text-gray-400"}`}>
                <Icon className={`w-4 h-4 ${active && step === "PROCESSING" ? "animate-spin" : ""}`} />
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-orange-600" : done ? "text-green-600" : "text-gray-400"}`}>{FLOW_LABELS[step]}</span>
            </div>
            {idx < FLOW.length - 1 && <div className={`flex-1 h-0.5 mx-1 -mt-4 ${idx < currentIdx ? "bg-green-500" : "bg-gray-200"}`} />}
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof ShoppingBag; label: string; value: number; accent: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold leading-none text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

// Ported from the Base44 app's src/pages/MerchOrdersDashboard.jsx.
// Realtime subscribe() replaced with a manual refresh button — no
// realtime infra exists in this rebuild (locked plan decision: polling/
// refetch, not a live subscription).
export default function MerchOrdersDashboard({ initialOrders }: { initialOrders: PlainMerchOrder[] }) {
  const router = useRouter();
  const [orders, setOrders] = useState<PlainMerchOrder[]>(initialOrders);
  const [filter, setFilter] = useState("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const stats = {
    total: orders.length,
    production: orders.filter((o) => PRODUCTION_STATUSES.includes(o.status)).length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  };

  const filters = ["all", "PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const bulkEligible = filtered.filter((o) => PRODUCTION_STATUSES.includes(o.status));

  const toggleSelect = (id: string) => setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const selectAll = () => setSelected(bulkEligible.map((o) => o.id));
  const clearSelection = () => setSelected([]);

  const bulkMarkShipped = async () => {
    if (selected.length === 0) return;
    setBulkLoading(true);
    try {
      await fetch("/api/musician/merch-orders/bulk-ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selected }),
      });
      setOrders((prev) => prev.map((o) => (selected.includes(o.id) ? { ...o, status: "SHIPPED" } : o)));
      setSelected([]);
      setBulkMode(false);
    } finally {
      setBulkLoading(false);
    }
  };

  const refresh = () => {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Merchandise Orders</h1>
            <p className="text-sm text-gray-500 mt-1">Track production and shipping status of fan orders.</p>
          </div>
          <button type="button" onClick={refresh} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600">
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard icon={ShoppingBag} label="Total Orders" value={stats.total} accent="bg-gray-100 text-gray-700" />
          <StatCard icon={Box} label="In Production" value={stats.production} accent="bg-amber-100 text-amber-700" />
          <StatCard icon={Truck} label="Shipped" value={stats.shipped} accent="bg-indigo-100 text-indigo-700" />
          <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} accent="bg-green-100 text-green-700" />
        </div>

        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {filters.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  setFilter(f);
                  setSelected([]);
                }}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? "bg-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
              >
                {f === "all" ? "All Orders" : FLOW_LABELS[f]}
              </button>
            ))}
          </div>
          {bulkEligible.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setBulkMode((v) => !v);
                setSelected([]);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${bulkMode ? "bg-orange-500 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              <Layers className="w-4 h-4" />
              {bulkMode ? "Exit Bulk Mode" : "Bulk Mode"}
            </button>
          )}
        </div>

        {bulkMode && bulkEligible.length > 0 && (
          <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5 mb-4">
            <button type="button" onClick={selected.length === bulkEligible.length ? clearSelection : selectAll} className="inline-flex items-center gap-2 text-sm font-medium text-orange-700 hover:text-orange-800">
              {selected.length === bulkEligible.length && selected.length > 0 ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
              {selected.length === bulkEligible.length && selected.length > 0 ? "Deselect all" : `Select all (${bulkEligible.length})`}
            </button>
            <span className="text-sm text-orange-700 font-medium">{selected.length} selected</span>
          </div>
        )}

        {bulkMode && selected.length > 0 && (
          <div className="sticky bottom-4 z-20 bg-black text-white rounded-xl shadow-2xl p-3 flex items-center justify-between gap-3 mb-4">
            <span className="text-sm font-medium">
              {selected.length} order{selected.length > 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={clearSelection} className="text-sm text-gray-300 hover:text-white px-3 py-1.5">
                Cancel
              </button>
              <button
                type="button"
                onClick={bulkMarkShipped}
                disabled={bulkLoading}
                className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                Mark all as Shipped
              </button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 shadow-sm text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No orders {filter !== "all" ? `with status "${FLOW_LABELS[filter]}"` : "yet"}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => {
              const addr = order.shippingAddress;
              return (
                <div key={order.id} className={`bg-white border rounded-xl shadow-sm p-4 md:p-5 ${bulkMode && selected.includes(order.id) ? "ring-2 ring-orange-500 border-orange-300" : "border-gray-200"}`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-4">
                    {bulkMode && (
                      <button
                        type="button"
                        onClick={() => toggleSelect(order.id)}
                        disabled={!PRODUCTION_STATUSES.includes(order.status)}
                        className="shrink-0 mt-1 disabled:opacity-30"
                        title={PRODUCTION_STATUSES.includes(order.status) ? "Select order" : "Already shipped"}
                      >
                        {selected.includes(order.id) ? <CheckSquare className="w-5 h-5 text-orange-500" /> : <Square className="w-5 h-5 text-gray-300" />}
                      </button>
                    )}
                    <div className="w-16 h-16 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                      {order.itemImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={order.itemImageUrl} alt={order.itemName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div>
                          <h3 className="font-semibold text-gray-900">{order.itemName}</h3>
                          <p className="text-sm text-gray-500">
                            {order.fanName || "Fan"} · Qty {order.quantity}
                            {order.size ? ` · Size ${order.size}` : ""}
                          </p>
                          {order.fanEmail && (
                            <a href={`mailto:${order.fanEmail}`} className="text-xs text-orange-600 hover:underline inline-flex items-center gap-1 mt-0.5">
                              {order.fanEmail}
                            </a>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">R{order.totalAmount.toLocaleString()}</p>
                          <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-1.5 text-xs text-gray-500 mt-2">
                        <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>{[addr.street, addr.city, addr.province, addr.postal_code, addr.country].filter(Boolean).join(", ") || "Address pending"}</span>
                      </div>

                      <div className="mt-4">
                        <StatusPipeline status={order.status} />
                      </div>

                      {order.trackingNumber && SHIPPING_STATUSES.includes(order.status) && (
                        <div className="mt-3 inline-flex items-center gap-2 text-xs bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5">
                          <Truck className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-gray-500">Tracking:</span>
                          <span className="font-mono font-medium text-gray-700">{order.trackingNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
