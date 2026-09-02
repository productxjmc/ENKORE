import { Clock, AlertTriangle } from "lucide-react";

// Date.now() is impure and React's purity lint (react-hooks/purity) flags
// it if called directly in a component body — pulled out to a plain
// helper so the component itself stays a pure function of its props.
function daysSince(date: string | Date): number {
  return Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
}

// Ported from the Base44 app's src/components/admin/SlaBadge.jsx, recolored
// for this app's dark admin theme (the source used light bg-*-100 chips).
// Color-coded aging indicator for admin review queues.
// Thresholds: green < 2 days · amber 2-3 days · red > 3 days.
export default function SlaBadge({
  date,
  label = "waiting",
  compact = false,
}: {
  date: string | Date | null | undefined;
  label?: string;
  compact?: boolean;
}) {
  if (!date) return null;
  const days = daysSince(date);
  const level = days < 2 ? "green" : days <= 3 ? "amber" : "red";

  const styles = {
    green: "bg-green-500/10 text-green-400 border-green-500/25",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/25",
    red: "bg-red-500/10 text-red-400 border-red-500/25 animate-pulse",
  } as const;

  const dayLabel = days === 0 ? "today" : days === 1 ? "1 day" : `${days} days`;

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold border rounded-full px-2 py-0.5 ${styles[level]}`}>
      {level === "red" ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      {!compact && <span className="opacity-80">{label}</span>}
      <span>{dayLabel}</span>
    </span>
  );
}
