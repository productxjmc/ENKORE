// Ported from the Base44 app's src/components/dashboard/SalesBreakdown.jsx
// — here the aggregation already happened server-side in page.tsx, this
// is purely presentational.
export default function SalesBreakdown({
  breakdown,
}: {
  breakdown: { thisWeekRevenue: number; lastWeekRevenue: number; allTimeRevenue: number; allTimeSales: number };
}) {
  const rows = [
    { label: "This week", value: breakdown.thisWeekRevenue },
    { label: "Last week", value: breakdown.lastWeekRevenue },
    { label: "All time", value: breakdown.allTimeRevenue },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm h-full">
      <h3 className="font-bold text-gray-900 mb-4">Sales Breakdown</h3>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-500">{row.label}</span>
            <span className="text-sm font-bold text-gray-900">R{row.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        ))}
        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-sm text-gray-500">Total sales</span>
          <span className="text-sm font-bold text-gray-900">{breakdown.allTimeSales}</span>
        </div>
      </div>
    </div>
  );
}
