"use client";

import QRCode from "react-qr-code";

// Reuses the same react-qr-code library the desktop dashboard's
// EventQRCode/check-in flow already depends on — the QR payload is just
// the ticket's own code, which the door-scanner check-in route (Phase 6)
// reads directly, matching the existing Attendance/check-in pattern.
export default function TicketQR({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-2 border-t-2 pt-3" style={{ borderColor: "var(--m-line)" }}>
      <div className="bg-white p-3">
        <QRCode value={code} size={140} level="M" style={{ height: "auto", maxWidth: "100%", width: "140px" }} />
      </div>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-text-muted)" }}>{code}</p>
    </div>
  );
}
