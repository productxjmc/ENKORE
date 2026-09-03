"use client";

import { useState } from "react";
import Link from "next/link";
import type { Musician, Track, Merchandise } from "@prisma/client";
import { Music, MapPin, Link2, Play, Download, DollarSign, MessageSquare, ShoppingBag, Heart, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActionButton from "@/components/common/ActionButton";
import CurrencySelector from "@/components/CurrencySelector";
import { useCurrency } from "@/lib/useCurrency";
import { formatFromZar, formatAmount, convertFromZar, CURRENCIES } from "@/lib/pricingConfig";

type SocialLinks = { instagram?: string; twitter?: string; facebook?: string };

// Decimal fields become plain numbers after page.tsx's toPlain() — see
// src/lib/serialize.ts for why that conversion has to happen before these
// cross the Server -> Client Component boundary at all.
export type PlainMusician = Omit<Musician, "totalRevenue"> & { totalRevenue: number };
export type PlainTrack = Omit<Track, "basePrice" | "minimumPrice" | "revenueGenerated"> & {
  basePrice: number | null;
  minimumPrice: number;
  revenueGenerated: number;
};
export type PlainMerchandise = Omit<Merchandise, "priceZar" | "priceNgn" | "priceUsd" | "revenueGenerated"> & {
  priceZar: number | null;
  priceNgn: number | null;
  priceUsd: number | null;
  revenueGenerated: number;
};

// Client half of the storefront — needs the currency hook (localStorage/
// geo-IP) and tab state, so it can't be a server component. Scoped down
// from src/pages/MusicianStorefront.jsx: Merch/Bookings/Community Wall
// tabs are honest placeholders (Stages 5, 6, 4) rather than faked.
// "Buy Track" now opens a real Payfast checkout (Stage 9) — see
// TrackCheckout below.
export function Storefront({ musician, tracks, merchandise }: { musician: PlainMusician; tracks: PlainTrack[]; merchandise: PlainMerchandise[] }) {
  const { currency } = useCurrency();
  const social = (musician.socialLinks as SocialLinks | null) ?? null;

  return (
    <div className="min-h-screen bg-gray-50 pb-0">
      <header className="bg-black text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-xl tracking-tight">
            ENKORE
          </Link>
          <Link href="/" className="text-sm text-gray-300 hover:text-orange-500 transition-colors">
            Discover More Musicians
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-br from-black via-gray-900 to-black text-white py-8 md:py-12 lg:py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            <motion.div className="flex-shrink-0" initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs, not worth a next.config.js remotePatterns entry yet */}
              <img
                src={musician.profileImage || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"}
                alt={musician.musicianName}
                loading="eager"
                className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 rounded-full border-4 border-orange-500 shadow-2xl object-cover"
              />
            </motion.div>

            <motion.div className="flex-1 text-center md:text-left" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4">{musician.musicianName}</h1>

              {musician.location && (
                <div className="flex items-center justify-center md:justify-start gap-2 text-gray-300 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{musician.location}</span>
                </div>
              )}

              {musician.bio && <p className="text-gray-300 text-lg mb-6 max-w-2xl">{musician.bio}</p>}

              {social && (
                <div className="flex items-center justify-center md:justify-start gap-4 mb-6">
                  {/* lucide-react dropped brand icons (Instagram/Twitter/Facebook)
                      in the version this app uses — a deliberate trademark-driven
                      removal upstream, not something to work around with a
                      second icon package for three links. Link2 + label instead. */}
                  {social.instagram && (
                    <a
                      href={social.instagram.startsWith("http") ? social.instagram : `https://instagram.com/${social.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-gray-300 hover:text-orange-500 transition-colors text-sm"
                    >
                      <Link2 className="w-4 h-4" /> Instagram
                    </a>
                  )}
                  {social.twitter && (
                    <a
                      href={social.twitter.startsWith("http") ? social.twitter : `https://twitter.com/${social.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-gray-300 hover:text-orange-500 transition-colors text-sm"
                    >
                      <Link2 className="w-4 h-4" /> Twitter
                    </a>
                  )}
                  {social.facebook && (
                    <a
                      href={social.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-gray-300 hover:text-orange-500 transition-colors text-sm"
                    >
                      <Link2 className="w-4 h-4" /> Facebook
                    </a>
                  )}
                </div>
              )}

              <div className="flex items-center justify-center md:justify-start gap-8 mb-6">
                <div>
                  <p className="text-2xl font-bold text-orange-500">{tracks.length}</p>
                  <p className="text-gray-400 text-sm">Tracks</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-4">
                <ActionButton icon={Heart} label={`Support ${musician.musicianName.split(" ")[0]}`} variant="primary" size="lg" disabled title="Coming soon" />
                <ActionButton
                  icon={MessageSquare}
                  label="Community Wall"
                  variant="outlineLight"
                  size="lg"
                  onClick={() => document.getElementById("community-wall")?.scrollIntoView({ behavior: "smooth" })}
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="flex justify-end mb-4">
          <CurrencySelector />
        </div>
        <Tabs defaultValue="music">
          <TabsList className="mb-8 bg-black text-white rounded-full px-1 py-1 w-auto inline-flex">
            <TabsTrigger value="music" className="rounded-full px-6 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <Music className="w-4 h-4 mr-2" />
              Music {tracks.length > 0 && `(${tracks.length})`}
            </TabsTrigger>
            <TabsTrigger value="merch" className="rounded-full px-6 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Merch {merchandise.length > 0 && `(${merchandise.length})`}
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full px-6 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <Calendar className="w-4 h-4 mr-2" />
              Bookings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music">
            {tracks.length === 0 ? (
              <div className="text-center py-16">
                <Music className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No tracks available yet</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tracks.map((track) => (
                  <TrackCard key={track.id} track={track} currency={currency} musicianCountry={musician.country} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="merch">
            {merchandise.length === 0 ? (
              <ComingSoon icon={ShoppingBag} text={`${musician.musicianName} hasn't listed any merchandise yet.`} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {merchandise.map((item) => (
                  <MerchTile key={item.id} item={item} currency={currency} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="bookings">
            <ComingSoon icon={Calendar} text={`Booking ${musician.musicianName} for an event is coming soon.`} />
          </TabsContent>
        </Tabs>
      </section>

      <section id="community-wall" className="container mx-auto px-4 py-8 md:py-12 bg-white rounded-xl md:rounded-2xl my-6 md:my-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-black mb-2">Community Wall</h2>
          <p className="text-sm md:text-base text-gray-600 mb-6">Show your love and support for {musician.musicianName}</p>
          <ComingSoon icon={MessageSquare} text="The Community Wall is coming soon." />
        </div>
      </section>
    </div>
  );
}

function TrackCard({
  track,
  currency,
  musicianCountry,
}: {
  track: PlainTrack;
  currency: ReturnType<typeof useCurrency>["currency"];
  musicianCountry: Musician["country"];
}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4 }}>
      <Card className="hover:shadow-xl transition-shadow overflow-hidden group">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
          <img
            src={track.coverArt || "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&h=600&fit=crop"}
            alt={track.title}
            loading="lazy"
            className="w-full h-48 object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all flex items-center justify-center pointer-events-none">
            <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1">{track.title}</h3>
          {track.genre && <p className="text-sm text-gray-500 mb-2">{track.genre}</p>}
          {track.description && <p className="text-sm text-gray-600 mb-4 line-clamp-2">{track.description}</p>}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-orange-600">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold">
                {track.payWhatYouWant
                  ? `${formatFromZar(track.minimumPrice || 0, currency)}+`
                  : formatFromZar(track.basePrice || 0, currency)}
              </span>
            </div>
            {track.downloadsCount > 0 && (
              <div className="flex items-center gap-1 text-gray-500 text-sm">
                <Download className="w-4 h-4" />
                <span>{track.downloadsCount}</span>
              </div>
            )}
          </div>
          {checkoutOpen ? (
            <TrackCheckout track={track} musicianCountry={musicianCountry} onCancel={() => setCheckoutOpen(false)} />
          ) : (
            <Button onClick={() => setCheckoutOpen(true)} className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
              Buy Track
            </Button>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Track prices are stored as a single ZAR-denominated number regardless of
// the musician's country (matches the original schema's own "Suggested
// price in ZAR" comment on the field) — but Kyshi charges in NGN, not ZAR.
// Sending the raw ZAR number straight to Kyshi with localCurrency: "NGN"
// would silently charge a Nigerian fan orders-of-magnitude less than
// intended (₦50 instead of the ZAR-equivalent ₦1,600ish). Both gateways
// below convert through the same convertFromZar() the storefront's price
// display already uses, so the amount shown, the amount submitted, and
// the amount charged are always the same number in the same currency —
// no place for a ZAR/NGN mixup to reach an actual payment.
function TrackCheckout({
  track,
  musicianCountry,
  onCancel,
}: {
  track: PlainTrack;
  musicianCountry: Musician["country"];
  onCancel: () => void;
}) {
  const gateway = musicianCountry === "NIGERIA" ? "kyshi" : "payfast";
  const checkoutCurrency = gateway === "kyshi" ? "NGN" : "ZAR";
  const zarBase = track.payWhatYouWant ? track.minimumPrice : (track.basePrice ?? track.minimumPrice);
  const minAmount = convertFromZar(track.minimumPrice, checkoutCurrency);

  const [fanName, setFanName] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [amount, setAmount] = useState(convertFromZar(zarBase, checkoutCurrency));
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      if (gateway === "kyshi") {
        const res = await fetch("/api/payments/kyshi/initialize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trackId: track.id,
            musicianId: track.musicianId,
            fanEmail,
            fanName: fanName || undefined,
            amount,
            localCurrency: "NGN",
          }),
        });
        const body = await res.json();
        if (!res.ok) throw new Error(body?.error || "Something went wrong. Please try again.");
        // Kyshi's checkout is a hosted page you GET-redirect to, unlike
        // Payfast's form-POST.
        window.location.href = body.authorizationUrl;
        return;
      }

      const res = await fetch("/api/payments/payfast/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackId: track.id, musicianId: track.musicianId, fanEmail, fanName: fanName || undefined, amount }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body?.error || "Something went wrong. Please try again.");
      }

      // Payfast checkout is a real browser form POST, not a fetch redirect
      // — build one, submit it, and let the navigation happen.
      const form = document.createElement("form");
      form.method = "POST";
      form.action = body.paymentUrl;
      for (const [key, value] of Object.entries(body.paymentData as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Please try again.");
    }
  };

  const fieldClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5">
      <input
        type="email"
        required
        placeholder="Your email"
        value={fanEmail}
        onChange={(e) => setFanEmail(e.target.value)}
        disabled={status === "submitting"}
        className={fieldClass}
      />
      <input
        type="text"
        placeholder="Your name (optional)"
        value={fanName}
        onChange={(e) => setFanName(e.target.value)}
        disabled={status === "submitting"}
        className={fieldClass}
      />
      {track.payWhatYouWant && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{CURRENCIES[checkoutCurrency].prefix}</span>
          <input
            type="number"
            required
            min={minAmount}
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={status === "submitting"}
            className={fieldClass}
          />
        </div>
      )}
      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={status === "submitting"} className="flex-1">
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={status === "submitting"}
          className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
        >
          {status === "submitting" ? "Redirecting…" : gateway === "kyshi" ? "Pay with Kyshi" : "Pay with Payfast"}
        </Button>
      </div>
      <p className="text-[11px] text-gray-400 text-center">
        Charged in {checkoutCurrency} via {gateway === "kyshi" ? "Kyshi" : "Payfast"}, regardless of the currency shown above.
      </p>
    </form>
  );
}

// Merch has direct per-currency fields (priceZar/priceNgn/priceUsd) rather
// than a single ZAR base musicians set once — unlike tracks, so this picks
// the field for the selected currency, falling back to converting from
// ZAR (same convertFromZar the rest of this page already uses) only when
// the musician hasn't set that specific currency's price.
function merchPriceFor(item: PlainMerchandise, currency: ReturnType<typeof useCurrency>["currency"]): number | null {
  if (currency === "ZAR") return item.priceZar;
  if (currency === "NGN") return item.priceNgn ?? (item.priceZar != null ? convertFromZar(item.priceZar, "NGN") : null);
  if (currency === "USD") return item.priceUsd ?? (item.priceZar != null ? convertFromZar(item.priceZar, "USD") : null);
  return item.priceZar != null ? convertFromZar(item.priceZar, currency) : null;
}

function MerchTile({ item, currency }: { item: PlainMerchandise; currency: ReturnType<typeof useCurrency>["currency"] }) {
  const [ordering, setOrdering] = useState(false);
  const price = merchPriceFor(item, currency);
  const inStock = item.isOnDemand || item.stockQuantity > 0;

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.4 }}>
      <Card className="hover:shadow-xl transition-shadow overflow-hidden group">
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URLs */}
          <img
            src={item.imageUrl || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=600&fit=crop"}
            alt={item.name}
            loading="lazy"
            className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {item.isOnDemand && <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold rounded-full px-2.5 py-1">On Demand</span>}
          {!inStock && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-bold text-lg">Out of Stock</span>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1">{item.name}</h3>
          <p className="text-sm text-gray-500 capitalize mb-2">{item.type.replace("_", " ").toLowerCase()}</p>
          {item.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>}
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-orange-600">{price != null ? formatAmount(price, currency) : "—"}</span>
            {!ordering && (
              <Button onClick={() => setOrdering(true)} disabled={!inStock || price == null} size="sm" className="bg-black hover:bg-gray-800 text-white">
                <ShoppingBag className="w-4 h-4 mr-1" /> Order
              </Button>
            )}
          </div>
          {ordering && <MerchOrder item={item} currency={currency} onCancel={() => setOrdering(false)} />}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// The no-online-payment "request" flow — MerchOrderModal.jsx (source) and
// its createMerchOrder backend function confirmed this directly (not
// assumed): a fan requests an item and the musician arranges payment/
// fulfillment afterward, no Payfast/Kyshi checkout involved. Inline-
// expand on the card rather than the source's Dialog, matching
// TrackCheckout's already-established pattern on this same page.
function MerchOrder({ item, currency, onCancel }: { item: PlainMerchandise; currency: ReturnType<typeof useCurrency>["currency"]; onCancel: () => void }) {
  const [fanName, setFanName] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [size, setSize] = useState(item.sizes[0] ?? "");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [province, setProvince] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("South Africa");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanName || !fanEmail || !street || !city) {
      setStatus("error");
      setErrorMessage("Please fill in all required fields.");
      return;
    }
    setStatus("submitting");
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/merchandise/${item.id}/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: 1,
          size,
          fanName,
          fanEmail,
          shippingAddress: { street, city, province, postal_code: postalCode, country },
          currency,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not place your order. Please try again.");
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Please try again.");
    }
  };

  const fieldClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  if (status === "done") {
    return <p className="mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">Order placed! The musician will be in touch shortly.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2">
        <input type="text" required placeholder="Your name" value={fanName} onChange={(e) => setFanName(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
        <input type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
      </div>
      {item.sizes.length > 0 && (
        <select value={size} onChange={(e) => setSize(e.target.value)} disabled={status === "submitting"} className={`${fieldClass} cursor-pointer`}>
          {item.sizes.map((s) => (
            <option key={s} value={s}>
              Size {s}
            </option>
          ))}
        </select>
      )}
      <input type="text" required placeholder="Street address *" value={street} onChange={(e) => setStreet(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
      <div className="grid grid-cols-2 gap-2">
        <input type="text" required placeholder="City *" value={city} onChange={(e) => setCity(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
        <input type="text" placeholder="Province" value={province} onChange={(e) => setProvince(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="text" placeholder="Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
        <input type="text" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
      </div>
      {errorMessage && <p className="text-xs text-red-600">{errorMessage}</p>}
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={status === "submitting"} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={status === "submitting"} className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
          {status === "submitting" ? "Placing order…" : "Place Order"}
        </Button>
      </div>
      <p className="text-[11px] text-gray-400 text-center">No payment now — the musician will contact you directly to arrange it.</p>
    </form>
  );
}

function ComingSoon({ icon: Icon, text }: { icon: typeof ShoppingBag; text: string }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-500 text-lg">{text}</p>
    </div>
  );
}
