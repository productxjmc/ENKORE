"use client";

import { Target, TrendingUp, Music, Users, Download, Trophy, Calendar, Trash2 } from "lucide-react";

export type PlainGoal = {
  id: string;
  goalType: "REVENUE" | "FOLLOWERS" | "TRACKS" | "DOWNLOADS" | "CUSTOM";
  title: string;
  description: string | null;
  targetValue: number;
  currentValue: number;
  endDate: string | Date;
  status: "ACTIVE" | "COMPLETED" | "CANCELLED" | "EXPIRED";
};

const GOAL_ICONS = { REVENUE: TrendingUp, FOLLOWERS: Users, TRACKS: Music, DOWNLOADS: Download, CUSTOM: Target } as const;
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-blue-100 text-blue-800",
  COMPLETED: "bg-green-100 text-green-800",
  CANCELLED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-red-100 text-red-800",
};

function daysRemaining(endDate: string | Date): number {
  const days = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

// Ported from the Base44 app's src/components/goals/GoalList.jsx. Progress
// bar hand-rolled (no Progress UI primitive exists in this app yet, and
// this is the only place that needs one).
export default function GoalList({ goals, onDelete }: { goals: PlainGoal[]; onDelete: (id: string) => void }) {
  if (goals.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
        <Trophy className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No goals yet. Create your first goal to start tracking your progress.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => {
        const Icon = GOAL_ICONS[goal.goalType] || Target;
        const progress = goal.targetValue ? Math.min((goal.currentValue / goal.targetValue) * 100, 100) : 0;
        const remaining = daysRemaining(goal.endDate);
        const isExpired = remaining === 0 && goal.status === "ACTIVE";

        return (
          <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-lg shrink-0">
                  <Icon className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{goal.title}</p>
                  {goal.description && <p className="text-xs text-gray-500 mt-0.5">{goal.description}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_COLORS[goal.status] || STATUS_COLORS.ACTIVE}`}>{goal.status.toLowerCase()}</span>
                <button type="button" onClick={() => onDelete(goal.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-gray-500">Progress</span>
              <span className="font-semibold text-gray-900">
                {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()}
                {goal.goalType === "REVENUE" && " ZAR"}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{progress.toFixed(1)}% complete</p>

            <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-gray-50">
              <span className="inline-flex items-center gap-1 text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {isExpired ? "Expired" : `${remaining} days remaining`}
              </span>
              <span className="text-gray-400">Due: {new Date(goal.endDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
