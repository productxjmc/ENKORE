"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Mail, Phone, MapPin, DollarSign, Clock, Loader2 } from "lucide-react";

export type PlainBookingEnquiry = {
  id: string;
  eventName: string;
  eventDate: string | Date;
  eventType: string | null;
  eventTime: string | null;
  venue: string | null;
  budget: string | null;
  organizerName: string;
  organizerEmail: string;
  organizerPhone: string | null;
  message: string | null;
  status: "PENDING" | "CONTACTED" | "CONFIRMED" | "DECLINED";
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 border-yellow-300",
  CONTACTED: "bg-blue-100 text-blue-800 border-blue-300",
  CONFIRMED: "bg-green-100 text-green-800 border-green-300",
  DECLINED: "bg-red-100 text-red-800 border-red-300",
};

// Ported from the Base44 app's src/components/bookings/BookingEnquiriesList.jsx.
// Server-fetched (via dashboard/page.tsx, unlike AvailabilityManager which
// must self-fetch for its calendar navigation) — status updates go through
// router.refresh(), same pattern as GoalsSection/TrackManagement.
export default function BookingEnquiriesList({ enquiries }: { enquiries: PlainBookingEnquiry[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, status: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/musician/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-4 h-4 text-orange-500" />
        <h3 className="font-bold text-gray-900 text-sm">Booking Enquiries</h3>
        {enquiries.length > 0 && <span className="bg-gray-100 text-gray-600 text-[10px] font-semibold rounded-full px-2 py-0.5">{enquiries.length}</span>}
      </div>

      {enquiries.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No booking enquiries yet.</p>
          <p className="text-gray-400 text-xs mt-1">When someone books you for an event, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {enquiries.map((eq) => (
            <div key={eq.id} className="border border-gray-100 rounded-lg p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900">{eq.eventName || "Untitled Event"}</p>
                  {eq.eventType && <span className="inline-block text-[10px] text-gray-500 border border-gray-200 rounded-full px-2 py-0.5 mt-1">{eq.eventType}</span>}
                </div>
                <span className={`text-[10px] font-semibold rounded-full border px-2 py-0.5 shrink-0 ${STATUS_COLORS[eq.status] || STATUS_COLORS.PENDING}`}>{eq.status.toLowerCase()}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-gray-600">
                {eq.eventDate && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>{new Date(eq.eventDate).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>
                )}
                {eq.eventTime && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>{eq.eventTime}</span>
                  </div>
                )}
                {eq.venue && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{eq.venue}</span>
                  </div>
                )}
                {eq.budget && (
                  <div className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                    <span>{eq.budget}</span>
                  </div>
                )}
              </div>

              {eq.message && <p className="text-xs text-gray-600 bg-gray-50 rounded p-2">&quot;{eq.message}&quot;</p>}

              <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-gray-50 text-xs">
                <span className="font-semibold text-gray-700">{eq.organizerName}</span>
                {eq.organizerEmail && (
                  <a href={`mailto:${eq.organizerEmail}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Mail className="w-3 h-3" /> {eq.organizerEmail}
                  </a>
                )}
                {eq.organizerPhone && (
                  <a href={`tel:${eq.organizerPhone}`} className="flex items-center gap-1 text-blue-600 hover:underline">
                    <Phone className="w-3 h-3" /> {eq.organizerPhone}
                  </a>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-gray-500">Update status:</span>
                <select
                  value={eq.status}
                  disabled={busyId === eq.id}
                  onChange={(e) => handleStatusChange(eq.id, e.target.value)}
                  className="h-8 text-xs rounded-lg border border-gray-200 px-2 outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-60 cursor-pointer"
                >
                  <option value="PENDING">Pending</option>
                  <option value="CONTACTED">Contacted</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="DECLINED">Declined</option>
                </select>
                {busyId === eq.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
