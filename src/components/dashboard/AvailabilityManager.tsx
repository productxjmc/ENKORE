"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, isSameDay, isSameMonth } from "date-fns";
import { Loader2, ChevronLeft, ChevronRight, Trash2, Plus, X, CalendarClock } from "lucide-react";

type Slot = { id: string; startTime: string; endTime: string; status: "AVAILABLE" | "BOOKED" | "BLOCKED" };

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-green-100 border-green-300 text-green-800",
  BOOKED: "bg-orange-100 border-orange-300 text-orange-800",
  BLOCKED: "bg-gray-200 border-gray-400 text-gray-600",
};

// Ported from the Base44 app's src/components/bookings/AvailabilityManager.jsx.
// Self-fetches per month (the calendar navigates client-side, so this
// can't be server-prop-driven like the rest of the dashboard) via
// GET/POST /api/musician/availability — the source's Mongo-style
// $gte/$lte filter becomes a plain query-param range here.
export default function AvailabilityManager() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (month: Date) => {
    setLoading(true);
    try {
      const start = startOfMonth(month).toISOString();
      const end = endOfMonth(month).toISOString();
      const res = await fetch(`/api/musician/availability?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`);
      const out = await res.json();
      setSlots(out.slots ?? []);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- this is a genuine external-system fetch reacting to currentMonth changing (calendar month nav), not synchronously-derivable state; no data-fetching library (React Query etc.) is wired into this codebase to replace it with
    fetchSlots(currentMonth);
  }, [currentMonth, fetchSlots]);

  const slotsByDate = useMemo(() => {
    const map: Record<string, Slot[]> = {};
    for (const s of slots) {
      const key = format(new Date(s.startTime), "yyyy-MM-dd");
      (map[key] ??= []).push(s);
    }
    return map;
  }, [slots]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    const days: Date[] = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    setSelectedDate(day);
    setShowForm(true);
    setStartTime("09:00");
    setEndTime("17:00");
    setError(null);
  };

  const handleCreateSlot = async () => {
    if (!selectedDate) return;
    setCreating(true);
    setError(null);
    try {
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch("/api/musician/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(`${dateStr}T${startTime}:00`).toISOString(),
          endTime: new Date(`${dateStr}T${endTime}:00`).toISOString(),
        }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        setError(out?.error || "Failed to add slot");
        return;
      }
      await fetchSlots(currentMonth);
    } catch {
      setError("Failed to add slot");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    await fetch(`/api/musician/availability/${slotId}`, { method: "DELETE" });
    await fetchSlots(currentMonth);
  };

  const selectedDateSlots = selectedDate ? (slotsByDate[format(selectedDate, "yyyy-MM-dd")] ?? []) : [];

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <CalendarClock className="w-4 h-4 text-orange-500" />
        <h3 className="font-bold text-gray-900 text-sm">Manage Your Availability</h3>
      </div>
      <p className="text-xs text-gray-500 mb-4">Click a date to add available time slots for bookings.</p>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-orange-500 animate-spin" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={() => setCurrentMonth((m) => addMonths(m, -1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h4 className="font-bold text-sm">{format(currentMonth, "MMMM yyyy")}</h4>
            <button type="button" onClick={() => setCurrentMonth((m) => addMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const key = format(day, "yyyy-MM-dd");
              const daySlots = slotsByDate[key] ?? [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateClick(day)}
                  className={`aspect-square rounded-lg text-xs flex flex-col items-center justify-center transition-all hover:ring-2 hover:ring-orange-400 ${
                    !isCurrentMonth ? "text-gray-300 bg-gray-50" : "text-gray-700"
                  } ${isToday ? "ring-1 ring-orange-400" : ""} ${daySlots.length > 0 ? "bg-green-50 border border-green-200" : "border border-gray-100"}`}
                >
                  <span>{format(day, "d")}</span>
                  {daySlots.length > 0 && <span className="text-[9px] leading-none mt-0.5 font-semibold text-green-600">{daySlots.length}</span>}
                </button>
              );
            })}
          </div>

          {showForm && selectedDate && (
            <div className="mt-4 p-4 border border-orange-100 rounded-lg bg-orange-50">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-semibold text-sm">{format(selectedDate, "EEEE, d MMMM yyyy")}</h5>
                <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {error && <div className="mb-3 text-xs text-red-600 bg-red-50 rounded px-2 py-1.5">{error}</div>}

              {selectedDateSlots.length > 0 && (
                <div className="mb-3 space-y-1">
                  {selectedDateSlots.map((slot) => (
                    <div key={slot.id} className={`flex items-center justify-between px-3 py-1.5 rounded-md text-xs border ${STATUS_STYLES[slot.status]}`}>
                      <span>
                        {format(new Date(slot.startTime), "HH:mm")} – {format(new Date(slot.endTime), "HH:mm")}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="uppercase text-[10px]">{slot.status}</span>
                        <button type="button" onClick={() => handleDeleteSlot(slot.id)} className="text-gray-500 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleCreateSlot}
                disabled={creating}
                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
              >
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Available Slot
              </button>
            </div>
          )}

          <div className="mt-4 flex items-center gap-4 text-[10px] text-gray-500">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
              <span>Has slots</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white border border-gray-100" />
              <span>Empty</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
