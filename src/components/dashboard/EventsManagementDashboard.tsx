"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import type { Event } from "@prisma/client";
import { ArrowLeft, Calendar, MapPin, Ticket, Loader2, Trash2, X, QrCode, Copy, Check } from "lucide-react";

export type PlainEvent = Omit<Event, "ticketPrice" | "revenueGenerated"> & {
  ticketPrice: number;
  revenueGenerated: number;
};

const STATUS_LABEL: Record<string, string> = { UPCOMING: "Upcoming", SOLD_OUT: "Sold Out", CANCELLED: "Cancelled", COMPLETED: "Completed" };
const STATUS_COLOR: Record<string, string> = {
  UPCOMING: "bg-green-100 text-green-800",
  SOLD_OUT: "bg-orange-100 text-orange-800",
  CANCELLED: "bg-red-100 text-red-700",
  COMPLETED: "bg-gray-100 text-gray-600",
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function CreateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [totalTickets, setTotalTickets] = useState("100");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/musician/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          venue,
          eventDate: new Date(eventDate).toISOString(),
          ticketPrice: Number(ticketPrice),
          totalTickets: Number.parseInt(totalTickets, 10),
        }),
      });
      if (!res.ok) {
        const out = await res.json().catch(() => null);
        setError(out?.error || "Failed to create event");
        return;
      }
      onSuccess();
    } catch {
      setError("Failed to create event");
    } finally {
      setSubmitting(false);
    }
  };

  const fieldClass = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-gray-900 text-sm">Create Event</h3>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm px-3 py-2">{error}</div>}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Event Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Live at the Chapel" className={fieldClass} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the event..." className={`${fieldClass} h-20 resize-none`} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Venue *</label>
            <input value={venue} onChange={(e) => setVenue(e.target.value)} required placeholder="e.g., Grand Hall, Lagos" className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Date &amp; Time *</label>
            <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required className={fieldClass} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Ticket Price (ZAR) *</label>
            <input type="number" min={0} step="0.01" value={ticketPrice} onChange={(e) => setTicketPrice(e.target.value)} required placeholder="150.00" className={fieldClass} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Total Tickets *</label>
            <input type="number" min={1} value={totalTickets} onChange={(e) => setTotalTickets(e.target.value)} required className={fieldClass} />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold text-sm rounded-lg py-2.5 transition-colors"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Event"}
        </button>
      </form>
    </div>
  );
}

function CheckInQRModal({ eventId, eventTitle, onClose }: { eventId: string; eventTitle: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const checkInUrl = typeof window !== "undefined" ? `${window.location.origin}/events/${eventId}/check-in` : "";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 text-sm">Check-In QR Code</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{eventTitle}</p>
        <div className="bg-white border border-gray-200 rounded-lg p-4 inline-block">
          {checkInUrl && <QRCode value={checkInUrl} size={200} />}
        </div>
        <p className="text-xs text-gray-400 mt-4 mb-2">Fans scan this at the door to check in.</p>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-600 hover:text-orange-700"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied!" : "Copy link"}
        </button>
      </div>
    </div>
  );
}

// Ported from the Base44 app's src/pages/EventsManagement.jsx +
// components/events/{CreateEventForm,EventsList}.jsx. Ticket sales
// (TicketPurchaseModal.jsx's Yoco flow) intentionally NOT ported here —
// see the initialize-ticket routes' comments — this dashboard links fans
// to the storefront's Events tab (Payfast/Kyshi) instead of embedding a
// second checkout entry point. Check-in QR uses react-qr-code rather than
// EventQRCodeDisplay.jsx's api.qrserver.com dependency (Phase 0 decision).
export default function EventsManagementDashboard({ initialEvents }: { initialEvents: PlainEvent[] }) {
  const router = useRouter();
  const [events, setEvents] = useState<PlainEvent[]>(initialEvents);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [qrEvent, setQrEvent] = useState<PlainEvent | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    setBusyId(id);
    try {
      await fetch(`/api/musician/events/${id}`, { method: "DELETE" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } finally {
      setBusyId(null);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/musician/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: status as PlainEvent["status"] } : e)));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-900 text-xs font-semibold uppercase tracking-wide transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Events</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your live events and ticket sales.</p>
          </div>
          {!showForm && (
            <button type="button" onClick={() => setShowForm(true)} className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-full px-4 py-2 transition-colors">
              + New Event
            </button>
          )}
        </div>

        {showForm && (
          <CreateForm
            onCancel={() => setShowForm(false)}
            onSuccess={() => {
              setShowForm(false);
              router.refresh();
            }}
          />
        )}

        {events.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 shadow-sm text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No events yet</p>
            <p className="text-sm text-gray-400 mt-1">Create your first event to start selling tickets</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {events.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-xl shadow-sm p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-bold text-gray-900">{event.title}</h3>
                    <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                      <MapPin className="w-3 h-3" /> {event.venue}
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${STATUS_COLOR[event.status]}`}>{STATUS_LABEL[event.status]}</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{toDatetimeLocal(event.eventDate as unknown as string).replace("T", " at ")}</p>
                {event.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>}
                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center gap-1 text-gray-700 font-semibold">R{event.ticketPrice.toLocaleString()}/ticket</div>
                  <div className="flex items-center gap-1 text-gray-500">
                    <Ticket className="w-3.5 h-3.5" /> {event.ticketsSold}/{event.totalTickets} sold
                  </div>
                </div>
                <p className="text-xs text-gray-400 mb-3">Revenue: R{event.revenueGenerated.toLocaleString()}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={event.status}
                    onChange={(e) => handleStatusChange(event.id, e.target.value)}
                    disabled={busyId === event.id}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
                  >
                    {Object.entries(STATUS_LABEL).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setQrEvent(event)}
                    className="inline-flex items-center gap-1.5 border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded-lg px-2.5 py-1.5"
                  >
                    <QrCode className="w-3.5 h-3.5" /> Check-In QR
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(event.id)}
                    disabled={busyId === event.id}
                    className="ml-auto inline-flex items-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-60 text-xs font-semibold rounded-lg px-2.5 py-1.5"
                  >
                    {busyId === event.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {qrEvent && <CheckInQRModal eventId={qrEvent.id} eventTitle={qrEvent.title} onClose={() => setQrEvent(null)} />}
    </div>
  );
}
