"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const DISMISSED_KEY = "enkore-m-install-dismissed";

// Chrome/Edge on Android fire `beforeinstallprompt` and let a page defer
// + later trigger it programmatically; iOS Safari has no such event at
// all (its own "Add to Home Screen" only lives in the browser's own
// share sheet, nothing a page can trigger) — this banner only ever
// appears where the real prompt exists, no fake "Install" button that
// does nothing on iOS.
export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return typeof window === "undefined" ? true : localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setDeferredPrompt(null);
      try {
        localStorage.setItem(DISMISSED_KEY, "1");
      } catch {
        // best-effort — worst case the banner would offer to install an already-installed app
      }
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const install = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BeforeInstallPromptEvent has no TS lib.dom entry
    const promptEvent = deferredPrompt as any;
    promptEvent.prompt();
    await promptEvent.userChoice;
    setDeferredPrompt(null);
  };

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      // per-visit dismissal still works even if it doesn't persist
    }
  };

  return (
    <div className="flex items-center gap-3 border-b-2 px-4 py-3" style={{ background: "var(--m-ink)", borderColor: "var(--m-line)", color: "#fff" }}>
      <Download className="h-5 w-5 flex-none" style={{ color: "var(--m-accent)" }} />
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-extrabold">Install ENKORE</p>
        <p className="text-[11px]" style={{ color: "rgba(243,242,242,.7)" }}>Add to your home screen for faster access, even offline.</p>
      </div>
      <button type="button" onClick={install} className="flex-none px-3 py-2 text-[12px] font-bold" style={{ background: "var(--m-accent)" }}>
        Install
      </button>
      <button type="button" onClick={dismiss} aria-label="Dismiss" className="flex-none p-1">
        <X className="h-4 w-4" style={{ color: "rgba(243,242,242,.6)" }} />
      </button>
    </div>
  );
}
