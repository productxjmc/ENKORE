"use client";

import { useState, use, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Music, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Result = { musicianName: string; eventTitle: string; discountCode: string; storefrontUrl: string | null };

// Ported from the Base44 app's src/pages/EventCheckIn.jsx — the page a
// fan lands on after scanning a musician's event check-in QR code (see
// EventsManagementDashboard.tsx's CheckInQRModal). Public, no auth —
// posts to /api/events/[id]/check-in (withServiceRole, since an anonymous
// check-in has no owning session for the Fan write).
export default function EventCheckInPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: eventId } = use(params);

  const [fanName, setFanName] = useState("");
  const [fanEmail, setFanEmail] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage("");
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fanName, fanEmail, city }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Check-in failed. Please ask event staff for help.");
      setResult(body);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Check-in failed. Please ask event staff for help.");
    }
  };

  const fieldClass = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500";

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          {status === "done" ? (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </div>
              <CardTitle className="text-xl text-green-700">You&apos;re checked in!</CardTitle>
              <CardDescription>{result?.eventTitle}</CardDescription>
            </>
          ) : status === "error" ? (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-14 h-14 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-700">Check-in failed</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-4">
                <Music className="w-14 h-14 text-orange-500" />
              </div>
              <CardTitle className="text-xl">Event Check-In</CardTitle>
              <CardDescription>Let the artist know you&apos;re here.</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "done" && result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm text-center">
              <p className="text-gray-600">Thanks for coming out to support {result.musicianName}!</p>
              <p className="text-gray-500">Your discount code:</p>
              <code className="block bg-white border border-green-200 rounded-lg px-3 py-2 font-bold text-green-700 text-lg">{result.discountCode}</code>
            </div>
          )}

          {(status === "idle" || status === "submitting" || status === "error") && (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input type="text" required placeholder="Your name" value={fanName} onChange={(e) => setFanName(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
              <input type="email" required placeholder="Your email" value={fanEmail} onChange={(e) => setFanEmail(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
              <input type="text" placeholder="City (optional)" value={city} onChange={(e) => setCity(e.target.value)} disabled={status === "submitting"} className={fieldClass} />
              <Button type="submit" disabled={status === "submitting"} className="w-full bg-orange-600 hover:bg-orange-700">
                {status === "submitting" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check In"}
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
