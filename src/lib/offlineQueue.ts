"use client";

// Generalizes the localStorage retry-queue pattern first built for the
// door-scanner (src/components/mobile/TicketScanner.tsx) — a real but
// smaller version of the original plan's IndexedDB + Background Sync
// ask, see that file's own comment for why. Reused here for any
// fire-and-forget POST that a fan or musician might make somewhere with
// bad signal (a church event, a venue basement) — Community Wall posts
// and booking requests are the two Phase 8 actually wires up, but any
// caller can queue{key} against its own POST shape.
type QueuedRequest = { url: string; body: unknown; queuedAt: number };

function queueKey(key: string): string {
  return `enkore-m-offline-queue:${key}`;
}

function loadQueue(key: string): QueuedRequest[] {
  try {
    return JSON.parse(localStorage.getItem(queueKey(key)) || "[]");
  } catch {
    return [];
  }
}

function saveQueue(key: string, queue: QueuedRequest[]) {
  try {
    localStorage.setItem(queueKey(key), JSON.stringify(queue));
  } catch {
    // storage unavailable — the request itself already succeeded or
    // failed synchronously; losing the ability to queue a retry is a
    // degraded experience, not a crash
  }
}

export function queueSize(key: string): number {
  return loadQueue(key).length;
}

// Attempts the POST immediately; if the browser is offline or the
// request throws (not just a non-2xx response — a real 4xx/5xx means
// the server actually received and rejected it, which queuing and
// blindly retrying would only repeat), it queues for later instead.
// Returns which happened so the caller can render the right state.
export async function postOrQueue(key: string, url: string, body: unknown): Promise<{ ok: boolean; queued: boolean }> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    const queue = loadQueue(key);
    queue.push({ url, body, queuedAt: Date.now() });
    saveQueue(key, queue);
    return { ok: false, queued: true };
  }
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return { ok: res.ok, queued: false };
  } catch {
    const queue = loadQueue(key);
    queue.push({ url, body, queuedAt: Date.now() });
    saveQueue(key, queue);
    return { ok: false, queued: true };
  }
}

// Flushes every queued request for `key`, in order, stopping to re-queue
// the rest on the first failure (so retries stay in order rather than
// silently dropping later ones out of sequence). Returns how many sent.
export async function flushQueue(key: string): Promise<number> {
  const queue = loadQueue(key);
  if (queue.length === 0) return 0;

  let sent = 0;
  for (let i = 0; i < queue.length; i++) {
    try {
      const res = await fetch(queue[i].url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(queue[i].body) });
      if (!res.ok) {
        saveQueue(key, queue.slice(i));
        return sent;
      }
      sent++;
    } catch {
      saveQueue(key, queue.slice(i));
      return sent;
    }
  }
  saveQueue(key, []);
  return sent;
}
