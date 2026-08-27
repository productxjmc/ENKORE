import Link from "next/link";
import { ArrowLeft, ArrowRight, ShoppingCart, ShoppingBag, Ticket, Heart, MapPin, Calendar, Wallet } from "lucide-react";
import Sparkle from "@/components/home/Sparkle";

// Adapted from the Base44 app's src/pages/DemoHub.jsx. The original was the
// landing page for a full interactive demo (dashboard/storefront/back-end
// walkthrough) gated behind an email + affiliate referral code — that gate
// depends on the affiliate/referral system (Stage 10, not built yet), and
// the walkthrough itself sold the R100,000 annual commission cap and
// MERCHBASE-style print-on-demand merch as headline features, both of
// which are deferred/unbuilt here. This is the ungated overview only:
// the same seven capabilities already promised on the homepage (the
// FeatureCarousel / "For Musicians" slide), described in more depth,
// with no interactive walkthrough and no reference to anything not
// actually built.
const FEATURES = [
  { icon: ShoppingCart, title: "Music", desc: "Sell your tracks direct to fans — no label middleman, no gatekeepers." },
  { icon: ShoppingBag, title: "Merchandise", desc: "Offer merch to your community, sold straight from your own storefront." },
  { icon: Ticket, title: "Tickets", desc: "Sell tickets to your shows and events directly through ENKORE." },
  { icon: Heart, title: "Subscriptions", desc: "Build recurring support from fans who believe in your calling." },
  { icon: MapPin, title: "Crowdfund", desc: "Raise support for tours and events from the community backing you." },
  { icon: Calendar, title: "Bookings", desc: "Accept booking enquiries and manage your availability in one place." },
  { icon: Wallet, title: "Payments", desc: "Full visibility into what you've earned, with transparent payouts." },
] as const;

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="max-w-3xl mx-auto px-5">
        <div className="flex items-center justify-center pt-8 pb-2">
          <span className="font-black text-2xl tracking-tight">ENKORE</span>
        </div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-500 hover:text-white text-xs font-semibold tracking-widest uppercase transition-colors duration-150 py-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </Link>
      </div>

      <section className="max-w-3xl mx-auto px-5 pt-8 pb-16 text-center">
        <p className="flex items-center justify-center gap-2 text-[#FF3700] text-xs font-black uppercase tracking-[0.3em] mb-4">
          <Sparkle className="w-3 h-3" />
          Demo
        </p>
        <h1 className="text-4xl md:text-5xl font-black leading-tight tracking-tight mb-4">
          Your music. Your ministry. <span className="text-[#FF3700]">Your business.</span>
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto mb-8">
          Here&apos;s what you get when you join ENKORE — sell direct, build real relationships with your supporters, and
          make your calling sustainable.
        </p>
        <Link
          href="/musician-pre-register"
          className="inline-flex items-center gap-2 bg-[#FF3700] hover:bg-[#CC2E00] text-white font-black uppercase px-8 py-4 rounded-full text-sm transition-colors duration-150"
        >
          Start Your Application <ArrowRight className="w-4 h-4" />
        </Link>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="w-11 h-11 rounded-full bg-[#FF3700]/15 flex items-center justify-center mb-4">
                <Icon className="w-5 h-5 text-[#FF3700]" />
              </div>
              <h3 className="font-black text-lg mb-1">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#FF3700] py-16 px-5 text-center">
        <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to build your music business?</h2>
        <p className="text-white/90 max-w-xl mx-auto mb-8">
          Join ENKORE as a Founding Musician and get access to everything above.
        </p>
        <Link
          href="/musician-pre-register"
          className="inline-flex items-center gap-2 bg-white text-[#FF3700] font-black uppercase px-8 py-4 rounded-full text-sm active:scale-[0.97] transition-transform shadow-lg"
        >
          Start Your Application <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </div>
  );
}
