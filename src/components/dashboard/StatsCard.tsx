import type { LucideIcon } from "lucide-react";
import { ArrowUp, ArrowDown } from "lucide-react";

// Ported from the Base44 app's src/components/dashboard/StatsCard.jsx.
export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | null;
  trendValue?: string | null;
  subtitle?: string;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center">
          <Icon className="w-4.5 h-4.5 text-orange-600" />
        </div>
        {trend && trendValue && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
            {trend === "up" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
      <p className="text-xs font-medium text-gray-500 mt-1.5">{title}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}
