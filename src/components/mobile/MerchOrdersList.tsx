"use client";

import { useState } from "react";
import { PackageCheck } from "lucide-react";
import { formatFromZar } from "@/lib/pricingConfig";

const STATUSES = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;
type Status = (typeof STATUSES)[number];

type Order = { id: string; itemName: string; quantity: number; size: string | null; totalAmount: number; fanName: string | null; status: Status; createdAt: string };

// Reuses PATCH /api/musician/merch-orders/[id] as-is.
export default function MerchOrdersList({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);

  const setStatus = async (id: string, status: Status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    await fetch(`/api/musician/merch-orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center py-10 text-center">
        <PackageCheck className="h-8 w-8" style={{ color: "var(--m-text-faint)" }} />
        <p className="mt-3 text-[13px]" style={{ color: "var(--m-text-muted)" }}>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {orders.map((o) => (
        <div key={o.id} className="border-t py-3" style={{ borderColor: "var(--m-hairline)" }}>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold">{o.itemName} {o.size ? `(${o.size})` : ""} × {o.quantity}</p>
            <span className="text-[13px] font-extrabold">{formatFromZar(o.totalAmount, "ZAR")}</span>
          </div>
          <p className="mt-0.5 text-[11px]" style={{ color: "var(--m-text-muted)" }}>{o.fanName ?? "Anonymous"} · {new Date(o.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })}</p>
          <select
            value={o.status}
            onChange={(e) => setStatus(o.id, e.target.value as Status)}
            className="mt-2 min-h-9 border-2 bg-[var(--m-ground)] px-2 text-[11px] font-bold uppercase"
            style={{ borderColor: "var(--m-line)" }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}
