"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import GoalForm from "@/components/dashboard/GoalForm";
import GoalList, { type PlainGoal } from "@/components/dashboard/GoalList";

// Wires GoalForm/GoalList together with the dashboard's page-refresh
// pattern (router.refresh() re-runs the server query rather than
// duplicating list-mutation logic client-side).
export default function GoalsSection({ goals }: { goals: PlainGoal[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this goal?")) return;
    await fetch(`/api/musician/goals/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900">Your Goals</h2>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-full px-4 py-2 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Goal"}
        </button>
      </div>
      {showForm && (
        <GoalForm
          onCancel={() => setShowForm(false)}
          onSuccess={() => {
            setShowForm(false);
            router.refresh();
          }}
        />
      )}
      <GoalList goals={goals} onDelete={handleDelete} />
    </div>
  );
}
