"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Merchandise } from "@prisma/client";
import { ArrowLeft, ShoppingBag, Upload, Loader2, DollarSign, Package, Trash2, X } from "lucide-react";
import { uploadFile } from "@/lib/blob";

export type PlainMerchandise = Omit<Merchandise, "priceZar" | "priceNgn" | "priceUsd" | "revenueGenerated"> & {
  priceZar: number | null;
  priceNgn: number | null;
  priceUsd: number | null;
  revenueGenerated: number;
};

const MAX_ITEMS = 5;
const MERCH_TYPES: { value: string; label: string }[] = [
  { value: "T_SHIRT", label: "T-Shirt" },
  { value: "HOODIE", label: "Hoodie" },
  { value: "CAP", label: "Cap" },
  { value: "POSTER", label: "Poster" },
  { value: "VINYL", label: "Vinyl" },
];
const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const TYPE_LABEL: Record<string, string> = Object.fromEntries(MERCH_TYPES.map((t) => [t.value, t.label]));

function CreateForm({ musicianId, existingCount, onSuccess, onCancel }: { musicianId: string; existingCount: number; onSuccess: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("T_SHIRT");
  const [description, setDescription] = useState("");
  const [priceZar, setPriceZar] = useState("");
  const [priceNgn, setPriceNgn] = useState("");
  const [priceUsd, setPriceUsd] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [isOnDemand, setIsOnDemand] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSize = (size: string) => setSizes((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, "track_cover", musicianId);
      setImageUrl(url);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (existingCount >= MAX_ITEMS) {
      setError(`You can only have up to ${MAX_ITEMS} merchandise items`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/musician/merchandise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          type,
          description: description || undefined,
          priceZar: Number(priceZar),
          priceNgn: priceNgn ? Number(priceNgn) : undefined,
          priceUsd: priceUsd ? Number(priceUsd) : undefined,
          imageUrl: imageUrl || undefined,
          sizes,
          isOnDemand,
        }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        setError(out?.error || "Failed to create merchandise item");
        return;
      }
      onSuccess();
    } catch {
      setError("Failed to create merchandise item");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-gray-900 text-sm">Create Merchandise Item</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500 border border-gray-200 rounded-full px-2.5 py-0.5">{existingCount}/{MAX_ITEMS} items</span>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Product Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Tour 2026 T-Shirt"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Product Type *</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 cursor-pointer">
            {MERCH_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the product..."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 h-20 resize-none"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price (ZAR) *</label>
            <input type="number" min={0} step="0.01" value={priceZar} onChange={(e) => setPriceZar(e.target.value)} required placeholder="250.00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price (NGN)</label>
            <input type="number" min={0} step="0.01" value={priceNgn} onChange={(e) => setPriceNgn(e.target.value)} placeholder="15000.00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Price (USD)</label>
            <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} placeholder="15.00" className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500" />
          </div>
        </div>

        {(type === "T_SHIRT" || type === "HOODIE") && (
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Available Sizes</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => toggleSize(size)}
                  className={`text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${sizes.includes(size) ? "bg-orange-500 border-orange-500 text-white" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5">Product Image</label>
          <label className="flex items-center gap-2 border-2 border-dashed border-gray-300 rounded-lg p-3 cursor-pointer hover:border-orange-400 transition-colors">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
            ) : (
              <Upload className="w-5 h-5 text-gray-400" />
            )}
            <span className="text-sm text-gray-600">{uploading ? "Uploading..." : imageUrl ? "Change image" : "Click to upload product image"}</span>
            {uploading && <Loader2 className="w-4 h-4 animate-spin text-orange-500 ml-auto" />}
            <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <label className="flex items-start gap-2 text-sm text-blue-800 cursor-pointer">
            <input type="checkbox" checked={isOnDemand} onChange={(e) => setIsOnDemand(e.target.checked)} className="mt-0.5 w-4 h-4 accent-blue-600" />
            <span>
              <strong>On-Demand Production:</strong> items are printed and shipped only when ordered. No upfront inventory needed.
            </span>
          </label>
        </div>

        <button
          type="submit"
          disabled={submitting || uploading || existingCount >= MAX_ITEMS}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Merchandise"}
        </button>
      </form>
    </div>
  );
}

// Ported from the Base44 app's src/pages/MerchandiseManagement.jsx +
// components/merch/{CreateMerchandiseForm,MerchandiseList}.jsx.
export default function MerchandiseManagementDashboard({ musicianId, initialItems }: { musicianId: string; initialItems: PlainMerchandise[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PlainMerchandise[]>(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/musician/merchandise/${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
          <Link href="/dashboard/merch-orders" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
            View Orders →
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Merchandise</h1>
            <p className="text-sm text-gray-500 mt-1">Manage what you sell alongside your music.</p>
          </div>
          {!showForm && (
            <button type="button" onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full px-4 py-2 transition-colors">
              + New Item
            </button>
          )}
        </div>

        {showForm && (
          <CreateForm
            musicianId={musicianId}
            existingCount={items.length}
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
        )}

        {items.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No merchandise yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first merchandise item to start selling</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {item.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full aspect-square object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500">{TYPE_LABEL[item.type]}</p>
                    </div>
                    <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${item.status === "ACTIVE" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>{item.status.toLowerCase()}</span>
                  </div>
                  {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
                  {item.sizes.length > 0 && (
                    <div className="flex gap-1 mb-3 flex-wrap">
                      {item.sizes.map((size) => (
                        <span key={size} className="text-[10px] border border-gray-200 rounded-full px-2 py-0.5 text-gray-500">
                          {size}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-gray-700 font-semibold">
                      <DollarSign className="w-3.5 h-3.5 text-gray-400" /> R{(item.priceZar ?? 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Package className="w-3.5 h-3.5" /> {item.unitsSold} sold
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Revenue: R{item.revenueGenerated.toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    disabled={busyId === item.id}
                    className="mt-3 w-full inline-flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-xs font-semibold rounded-lg py-2 transition-colors"
                  >
                    {busyId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
