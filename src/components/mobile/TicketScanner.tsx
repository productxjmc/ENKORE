"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, Camera, WifiOff } from "lucide-react";

type ScanResult = { code: string; ok: boolean; message: string };
type QueuedScan = { eventId: string; ticketCode: string; queuedAt: number };

const QUEUE_KEY = "enkore-m-checkin-queue";

function loadQueue(): QueuedScan[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}
function saveQueue(q: QueuedScan[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(q));
  } catch {
    // storage unavailable — queue just won't survive a reload, scan itself still worked or failed synchronously
  }
}

// Camera scanning uses the browser's built-in BarcodeDetector API where
// available (Chrome/Edge on Android, Safari 17+) rather than pulling in
// a JS QR library — feature-detected, with manual code entry as the
// fallback everywhere it isn't. Offline handling is a real but smaller
// version of what the plan called for: a localStorage queue that
// retries on the browser's `online` event, not the full IndexedDB +
// Background Sync API pairing (that needs service-worker-level changes
// or of a piece with Phase 8's broader offline-first pass, not
// justified for this one screen alone).
export default function TicketScanner({ eventId }: { eventId: string }) {
  const [manualCode, setManualCode] = useState("");
  const [results, setResults] = useState<ScanResult[]>([]);
  const [cameraSupported] = useState(() => typeof window !== "undefined" && "BarcodeDetector" in window);
  const [scanning, setScanning] = useState(false);
  const [queueSize, setQueueSize] = useState(() => (typeof window === "undefined" ? 0 : loadQueue().filter((q) => q.eventId === eventId).length));
  const [online, setOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScanRef = useRef<{ code: string; at: number } | null>(null);

  const submitScan = async (code: string): Promise<ScanResult> => {
    if (!navigator.onLine) {
      const queue = loadQueue();
      queue.push({ eventId, ticketCode: code, queuedAt: Date.now() });
      saveQueue(queue);
      setQueueSize(queue.filter((q) => q.eventId === eventId).length);
      return { code, ok: false, message: "Offline — queued, will check in once you're back online" };
    }
    try {
      const res = await fetch("/api/m/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId, ticketCode: code }),
      });
      const body = await res.json();
      if (!res.ok) return { code, ok: false, message: body?.error || "Not valid" };
      return { code, ok: true, message: `${body.fanName} checked in${body.quantity > 1 ? ` (×${body.quantity})` : ""}` };
    } catch {
      const queue = loadQueue();
      queue.push({ eventId, ticketCode: code, queuedAt: Date.now() });
      saveQueue(queue);
      setQueueSize(queue.filter((q) => q.eventId === eventId).length);
      return { code, ok: false, message: "Network error — queued, will retry" };
    }
  };

  const flushQueue = async () => {
    const queue = loadQueue();
    const mine = queue.filter((q) => q.eventId === eventId);
    if (mine.length === 0) return;
    const rest = queue.filter((q) => q.eventId !== eventId);
    for (const q of mine) {
      const result = await submitScan(q.ticketCode);
      setResults((prev) => [result, ...prev].slice(0, 20));
    }
    saveQueue(loadQueue().filter((q) => q.eventId !== eventId).concat(rest.filter((q) => q.eventId !== eventId)));
    setQueueSize(0);
  };

  useEffect(() => {
    const goOnline = () => { setOnline(true); void flushQueue(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- flushQueue closes over eventId, which is this component's own prop; a real change re-mounts the whole page (route param)
  }, [eventId]);

  const handleCode = async (code: string) => {
    const now = Date.now();
    if (lastScanRef.current?.code === code && now - lastScanRef.current.at < 3000) return;
    lastScanRef.current = { code, at: now };
    const result = await submitScan(code);
    setResults((prev) => [result, ...prev].slice(0, 20));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      scanLoop();
    } catch {
      setResults((prev) => [{ code: "", ok: false, message: "Camera access denied" }, ...prev]);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  const scanLoop = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BarcodeDetector has no TS lib.dom entry yet
    const Detector = (window as any).BarcodeDetector;
    const detector = new Detector({ formats: ["qr_code"] });
    const tick = async () => {
      if (!streamRef.current || !videoRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        if (codes.length > 0) await handleCode(codes[0].rawValue);
      } catch {
        // a frame that fails to decode is normal, not an error state
      }
      if (streamRef.current) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div>
      {!online && (
        <p className="mb-3 flex items-center gap-2 border-l-4 px-3 py-2 text-[12px] font-semibold" style={{ borderColor: "var(--m-accent)", background: "#fff2ef", color: "#5c1b0c" }}>
          <WifiOff className="h-4 w-4" /> Offline — scans will queue and check in once you reconnect
        </p>
      )}
      {queueSize > 0 && (
        <p className="mb-3 text-[12px]" style={{ color: "var(--m-text-muted)" }}>{queueSize} scan{queueSize === 1 ? "" : "s"} queued</p>
      )}

      {cameraSupported ? (
        <div>
          {scanning ? (
            <div>
              <video ref={videoRef} className="w-full border-2" style={{ borderColor: "var(--m-line)" }} muted playsInline />
              <button type="button" onClick={stopCamera} className="mt-2 min-h-11 w-full border-2 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
                Stop scanning
              </button>
            </div>
          ) : (
            <button type="button" onClick={startCamera} className="flex min-h-[52px] w-full items-center justify-center gap-2 text-[13px] font-bold text-white" style={{ background: "var(--m-accent)" }}>
              <Camera className="h-4 w-4" /> Start scanning
            </button>
          )}
        </div>
      ) : (
        <p className="text-[12px]" style={{ color: "var(--m-text-muted)" }}>Camera scanning isn&apos;t supported on this browser — enter the ticket code manually below.</p>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={manualCode}
          onChange={(e) => setManualCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && manualCode.trim()) {
              handleCode(manualCode.trim());
              setManualCode("");
            }
          }}
          placeholder="Enter ticket code"
          className="min-h-11 flex-1 border-2 bg-[var(--m-ground)] px-3 text-[14px] outline-none focus:border-[var(--m-accent)]"
          style={{ borderColor: "var(--m-line)" }}
        />
        <button
          type="button"
          onClick={() => { if (manualCode.trim()) { handleCode(manualCode.trim()); setManualCode(""); } }}
          className="min-h-11 px-4 text-[12px] font-bold text-white"
          style={{ background: "var(--m-accent)" }}
        >
          Check in
        </button>
      </div>

      <div className="mt-5 flex flex-col gap-2">
        {results.map((r, i) => (
          <div key={i} className="flex items-center gap-2 border-2 p-3" style={{ borderColor: r.ok ? "var(--m-line)" : "var(--m-accent)" }}>
            {r.ok ? <CheckCircle2 className="h-4 w-4 flex-none" style={{ color: "#1a7f37" }} /> : <XCircle className="h-4 w-4 flex-none" style={{ color: "var(--m-accent)" }} />}
            <p className="text-[13px]">{r.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
