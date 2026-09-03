"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Download, MapPin } from "lucide-react";
import { downloadSvgAsPng } from "@/lib/qrDownload";

// Ported from the Base44 app's src/components/qr/EventQRCode.jsx — the
// general ad-hoc "connect with me at this event" QR (distinct from Phase
// 10's per-Event ticket check-in QR, which is tied to a specific Event
// row and issues a discount code). This one is just a location label +
// a Follow. The source pointed at /connect/{musician.id}, a route that
// doesn't exist anywhere in Base44 either — src/app/connect/[id] and its
// backing API route are new here, built to actually back this QR rather
// than leave it decorative. QR rendering consolidated onto react-qr-code
// + downloadSvgAsPng (Phase 12's QR consolidation) instead of the
// source's two separate api.qrserver.com image requests.
export default function EventQRCode({ musicianId, musicianName }: { musicianId: string; musicianName: string }) {
  const [eventLocation, setEventLocation] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://enkoremusic.africa";
  const qrUrl = `${origin}/connect/${musicianId}?location=${encodeURIComponent(eventLocation)}`;

  const generateQR = () => {
    if (eventLocation.trim()) setShowQR(true);
  };

  const downloadQR = async () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDownloading(true);
    try {
      await downloadSvgAsPng(svgEl, `enkore-qr-${eventLocation.replace(/\s+/g, "-").toLowerCase()}.png`);
    } catch (e) {
      console.error("QR download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-orange-500" />
          Live Event QR Code
        </CardTitle>
        <CardDescription>Generate a QR code for fans to connect with you at live events</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="event-location">Event Location *</Label>
          <div className="flex gap-2 mt-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                id="event-location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="e.g., Constitution Hill, Johannesburg"
                className="pl-10"
              />
            </div>
            <Button onClick={generateQR} className="bg-orange-500 hover:bg-orange-600" disabled={!eventLocation.trim()}>
              Generate
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">This helps you track where your fans are located</p>
        </div>

        {showQR && (
          <div className="space-y-4">
            <div ref={qrRef} className="bg-white p-6 rounded-lg border-2 border-gray-200 flex flex-col items-center">
              <div className="mb-4">
                <QRCode value={qrUrl} size={200} level="M" style={{ height: "auto", maxWidth: "100%", width: "200px" }} />
              </div>
              <p className="text-sm font-semibold text-center text-gray-700">Scan to connect with {musicianName}</p>
              <p className="text-xs text-gray-500 text-center mt-1">{eventLocation}</p>
            </div>

            <Button onClick={downloadQR} variant="outline" className="w-full" disabled={downloading}>
              <Download className="w-4 h-4 mr-2" />
              {downloading ? "Preparing…" : "Download QR Code"}
            </Button>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-orange-800">
                <strong>Tip:</strong> Print this QR code or display it on screens at your event. Fans can scan it to instantly follow you and join your community!
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
