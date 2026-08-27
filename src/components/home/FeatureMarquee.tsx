import Sparkle from "./Sparkle";

const FEATURES = [
  "Direct Sales",
  "Merchandise",
  "Ticketing",
  "Fan Subscriptions",
  "Tour Funding",
  "Bookings",
  "Payouts",
];

function Track({ hidden = false }: { hidden?: boolean }) {
  return (
    <div className="flex items-center shrink-0" aria-hidden={hidden}>
      {FEATURES.map((f) => (
        <span
          key={f}
          className="flex items-center gap-6 px-6 text-white/70 text-sm font-bold uppercase tracking-widest whitespace-nowrap"
        >
          {f}
          <Sparkle className="w-3 h-3 text-[#FF3700]" />
        </span>
      ))}
    </div>
  );
}

// A dark auto-scrolling ticker band, structurally borrowed from
// revelator.com's "A Complete Operating System" marquee — an infinite
// horizontal loop of platform capabilities, using ENKORE's own feature
// set. Pure CSS animation (see .animate-marquee in globals.css) over a
// duplicated track rather than JS, since it never needs to respond to
// state. The second track is aria-hidden — it exists only to make the
// loop visually seamless, so the feature list stays readable to screen
// readers exactly once instead of repeating forever.
export default function FeatureMarquee() {
  return (
    <div className="snap-start w-full bg-black py-5 overflow-hidden">
      <div className="flex w-max animate-marquee">
        <Track />
        <Track hidden />
      </div>
    </div>
  );
}
