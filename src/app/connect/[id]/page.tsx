"use client";

import { Suspense, useEffect, useState, use, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Music, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type MusicianInfo = { musicianName: string; profileImage: string | null };
type Result = { musicianName: string; storefrontUrl: string | null };

// Backs EventQRCode.tsx's ad-hoc "connect with me at this event" QR — a
// public follow-only landing page (no ticket, no discount code, unlike
// Phase 10's per-Event check-in). Reads ?location= from the QR's URL and
// forwards it to /api/musicians/[id]/connect for the Follow row's
// location field, which LocationMap.tsx then groups by. useSearchParams
// needs a Suspense boundary (same reason payment-confirmation/page.tsx
// has one) — split into a wrapper + inner content component for that.
export default function ConnectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: musicianId } = use(params);
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
          <Loader2 className="w-14 h-14 text-orange-500 animate-spin" />
        </div>
      }
    >
      <ConnectContent musicianId={musicianId} />
    </Suspense>
  );
}

function ConnectContent({ musicianId }: { musicianId: string }) {
  const searchParams = useSearchParams();
  const location = searchParams.get("location") || "";

  const [musician, setMusician] = useState<MusicianInfo | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [fanName, setFanName] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    fetch(`/api/musicians/${musicianId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((body) => setMusician(body.musician))
      .catch(() => setLoadError(true));
  }, [musicianId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/musicians/${musicianId}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fanName, fanEmail, location }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Could not connect. Please try again.");
      setResult(body);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Could not connect. Please try again.");
    }
  };

  const fieldClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="w-14 h-14 text-red-500" />
            </div>
            <CardTitle className="text-xl text-red-700">Musician not found</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          {status === "done" ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </div>
              <CardTitle className="text-xl text-green-700">You&apos;re connected!</CardTitle>
              <CardDescription>Thanks for supporting {result?.musicianName}.</CardDescription>
            </>
          ) : status === "error" ? (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-14 h-14 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-700">Something went wrong</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                {musician?.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URL
                  <img src={musician.profileImage} alt={musician.musicianName} className="w-20 h-20 rounded-full object-cover border-4 border-orange-500" />
                ) : (
                  <Music className="w-14 h-14 text-orange-500" />
                )}
              </div>
              <CardTitle className="text-xl">Connect with {musician?.musicianName || "…"}</CardTitle>
              <CardDescription>{location ? `Live now at ${location}` : "Follow to stay in the loop"}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {(status === "idle" || status === "submitting" || status === "error") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" required placeholder="Your name" value={fanName} onChange={(e) => setFanName(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
              <input type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
              <Button type="submit" disabled={status === "submitting" || !musician} className="w-full bg-orange-600 hover:bg-orange-700">
                {status === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Follow"}
              </Button>
            </form>
          )}

          {status === "done" && result?.storefrontUrl && (
            <Link href={`/${result.storefrontUrl}`} className="block">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">Visit {result.musicianName}&apos;s Storefront</Button>
            </Link>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
