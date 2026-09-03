import { ShoppingCart, MessageCircle, UserPlus, Star } from "lucide-react";

export type ActivityItem = {
  type: "purchase" | "message" | "follow";
  title: string;
  description: string;
  date: string | Date;
  amount: number | null;
  isNew: boolean;
  isTopFan: boolean;
};

const ICONS = { purchase: ShoppingCart, message: MessageCircle, follow: UserPlus } as const;

// Ported from the Base44 app's src/components/dashboard/RecentActivity.jsx.
export default function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <h3 className="font-bold text-gray-900 mb-4">Recent Activity</h3>
      {activities.length === 0 ? (
        <p className="text-sm text-gray-400">Nothing yet — activity from fans will show up here.</p>
      ) : (
        <div className="space-y-3">
          {activities.map((item, i) => {
            const Icon = ICONS[item.type];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate flex items-center gap-1.5">
                    {item.title}
                    {item.isTopFan && <Star className="w-3 h-3 text-orange-500 shrink-0" fill="currentColor" />}
                    {item.isNew && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}
                  </p>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                {item.amount != null && <p className="text-sm font-bold text-green-600 shrink-0">R{item.amount.toFixed(0)}</p>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
