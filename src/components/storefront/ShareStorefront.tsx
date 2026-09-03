"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
// lucide-react dropped brand icons (Facebook/Twitter/Instagram) in the
// version this app uses — a deliberate trademark-driven removal upstream,
// same gap already worked around in src/app/[slug]/Storefront.tsx.
// Link2 + label instead, not a second icon package for three buttons.
import { Share2, Copy, CheckCircle2, QrCode, Download, MessageCircle, Link2, Music2 } from "lucide-react";
import { downloadSvgAsPng } from "@/lib/qrDownload";

// Ported from the Base44 app's src/components/storefront/ShareStorefront.jsx.
// Two fixes from the source: the QR now renders via react-qr-code +
// downloadSvgAsPng instead of html2canvas + an api.qrserver.com image
// (Phase 0/12's QR consolidation decision — see qrDownload.ts), and the
// share URL is enkoremusic.africa/{slug} — this rebuild's real storefront
// route (src/app/[slug]/page.tsx) — not the source's nonexistent
// /musician/{slug} path.
export default function ShareStorefront({ storefrontUrl }: { storefrontUrl: string }) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const fullUrl = typeof window !== "undefined" ? `${window.location.origin}/${storefrontUrl}` : `https://enkoremusic.africa/${storefrontUrl}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`Check out my ENKORE store where you can buy music, merch, or tickets! ${fullUrl}`);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  const shareOnX = () => {
    const text = encodeURIComponent(`Check out my ENKORE store where you can buy music, merch, or tickets!`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(fullUrl)}`, "_blank");
  };

  const shareOnInstagram = async () => {
    await handleCopy();
    alert("Link copied! Open Instagram and paste it in your story or post.");
  };

  const shareOnTikTok = async () => {
    await handleCopy();
    alert("Link copied! Open TikTok and paste it in your bio or video caption.");
  };

  const downloadQRCode = async () => {
    const svgEl = qrRef.current?.querySelector("svg");
    if (!svgEl) return;
    setDownloading(true);
    try {
      await downloadSvgAsPng(svgEl, `${storefrontUrl}-qr-code.png`);
    } catch (e) {
      console.error("QR download failed", e);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5" />
          Share Your Storefront
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Your unique storefront URL:</p>
            <div className="flex gap-2">
              <Input value={fullUrl} readOnly className="flex-1" />
              <Button onClick={handleCopy} variant="outline" size="icon" className={copied ? "bg-green-50 border-green-500" : ""}>
                {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            <Button onClick={shareOnWhatsApp} className="bg-[#25D366] hover:bg-[#20BA5A] text-white">
              <MessageCircle className="w-4 h-4 mr-2" />
              WhatsApp
            </Button>
            <Button onClick={shareOnFacebook} className="bg-[#1877F2] hover:bg-[#145DBF] text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Facebook
            </Button>
            <Button onClick={shareOnX} className="bg-black hover:bg-gray-800 text-white">
              <Link2 className="w-4 h-4 mr-2" />
              X
            </Button>
            <Button onClick={shareOnInstagram} className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white">
              <Link2 className="w-4 h-4 mr-2" />
              Instagram
            </Button>
            <Button onClick={shareOnTikTok} className="bg-black hover:bg-gray-800 text-white">
              <Music2 className="w-4 h-4 mr-2" />
              TikTok
            </Button>
          </div>

          <div className="border-t pt-4">
            <Button onClick={() => setShowQR(!showQR)} variant="outline" className="w-full">
              <QrCode className="w-4 h-4 mr-2" />
              {showQR ? "Hide QR Code" : "Show QR Code"}
            </Button>

            {showQR && (
              <div className="mt-4 space-y-3">
                <div ref={qrRef} className="bg-white p-6 rounded-lg border-2 border-gray-200 text-center">
                  <div className="inline-block">
                    <QRCode value={fullUrl} size={180} level="M" style={{ height: "auto", maxWidth: "100%", width: "180px" }} />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-3">Scan to visit my ENKORE store</p>
                  <p className="text-xs text-gray-500 mt-1">{storefrontUrl}</p>
                </div>
                <Button onClick={downloadQRCode} variant="outline" className="w-full" disabled={downloading}>
                  <Download className="w-4 h-4 mr-2" />
                  {downloading ? "Preparing…" : "Download QR Code"}
                </Button>
              </div>
            )}
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">Share this link on your social media, website, or anywhere you connect with fans!</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
