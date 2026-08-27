// Small four-point sparkle accent, structurally borrowed from revelator.com's
// use of a star mark next to bold section headlines. Pure SVG (no icon
// package has this shape) — always decorative, so always aria-hidden.
export default function Sparkle({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 0c.6 4.6 2 8 4 10s5.4 3.4 10 4c-4.6.6-8 2-10 4s-3.4 5.4-4 10c-.6-4.6-2-8-4-10S2.6 14.6 0 14c4.6-.6 8-2 10-4s3.4-5.4 4-10z" />
    </svg>
  );
}
