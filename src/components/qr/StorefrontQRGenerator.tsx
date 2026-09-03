"use client";

import { useRef, useState } from "react";
import QRCode from "react-qr-code";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, Download, Store, Music, ShoppingBag, Loader2 } from "lucide-react";
import { downloadSvgAsPng, slugifyForFilename } from "@/lib/qrDownload";

type QRTrack = { id: string; title: string; genre: string | null };
type QRMerchItem = { id: string; name: string; type: string };

function QRPreview({
  value,
  label,
  sublabel,
  onContainerRef,
  downloading,
  onDownload,
}: {
  value: string;
  label: string;
  sublabel: string;
  onContainerRef: (el: HTMLDivElement | null) => void;
  downloading: boolean;
  onDownload: () => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="bg-white p-4 sm:p-5 rounded-xl border-2 border-gray-200 flex flex-col items-center w-full max-w-xs">
        <div className="bg-white p-2 rounded-lg" ref={onContainerRef}>
          <QRCode value={value} size={180} level="M" style={{ height: "auto", maxWidth: "100%", width: "180px" }} />
        </div>
        {label && <p className="text-sm font-semibold text-center text-gray-800 mt-3 truncate w-full">{label}</p>}
        {sublabel && <p className="text-xs text-gray-500 text-center mt-0.5 truncate w-full">{sublabel}</p>}
      </div>
      <Button onClick={onDownload} variant="outline" className="w-full max-w-xs mt-3" disabled={downloading}>
        {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
        Download PNG
      </Button>
    </div>
  );
}

// Ported from the Base44 app's src/components/qr/StorefrontQRGenerator.jsx.
// Fixes two broken routes from the source rather than replicating them:
// storefront links now point at enkoremusic.africa/{slug} (this rebuild's
// real route, not the source's /musician/{slug}), and track/merch QR
// codes point at the storefront's Music/Merch tab (?tab=music|merch,
// honored by Storefront.tsx's initial-tab query param) rather than the
// source's /TrackDetails?id= and unhandled ?merch= — neither of which
// this rebuild (or, per direct inspection, even Base44 itself) has a
// working per-item detail page for.
//
// Container elements are tracked via a plain mutable map assigned only
// inside a ref callback (invoked during commit) — never read during
// render. The source's (and this file's own earlier draft's) pattern of
// lazily creating a RefObject inside the render body and handing it back
// trips react-hooks/refs ("Cannot access refs during render").
export default function StorefrontQRGenerator({
  storefrontUrl,
  musicianName,
  tracks,
  merch,
}: {
  storefrontUrl: string;
  musicianName: string;
  tracks: QRTrack[];
  merch: QRMerchItem[];
}) {
  const [tab, setTab] = useState("storefront");
  const [downloadingKey, setDownloadingKey] = useState<string | null>(null);
  const origin = typeof window !== "undefined" ? window.location.origin : "https://enkoremusic.africa";
  const storefrontFullUrl = `${origin}/${storefrontUrl}`;

  const containerEls = useRef<Record<string, HTMLDivElement | null>>({});

  const handleDownload = async (key: string, filename: string) => {
    const svgEl = containerEls.current[key]?.querySelector("svg");
    if (!svgEl) return;
    setDownloadingKey(key);
    try {
      await downloadSvgAsPng(svgEl, filename);
    } catch (e) {
      console.error("QR download failed", e);
    } finally {
      setDownloadingKey(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="w-5 h-5 text-orange-500" />
          Storefront &amp; Product QR Codes
        </CardTitle>
        <CardDescription>Generate scannable QR codes for your storefront and product tabs. Print them on flyers, stickers, or merch tags.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-black text-white rounded-full px-1 py-1 w-auto inline-flex">
            <TabsTrigger value="storefront" className="rounded-full px-5 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <Store className="w-4 h-4 mr-2" /> Storefront
            </TabsTrigger>
            <TabsTrigger value="tracks" className="rounded-full px-5 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <Music className="w-4 h-4 mr-2" /> Tracks {tracks.length > 0 && `(${tracks.length})`}
            </TabsTrigger>
            <TabsTrigger value="merch" className="rounded-full px-5 py-2 data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-300">
              <ShoppingBag className="w-4 h-4 mr-2" /> Merch {merch.length > 0 && `(${merch.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="storefront">
            <div className="flex flex-col items-center py-2">
              <QRPreview
                value={storefrontFullUrl}
                label={musicianName || "My Storefront"}
                sublabel={`/${storefrontUrl}`}
                onContainerRef={(el) => {
                  containerEls.current.storefront = el;
                }}
                downloading={downloadingKey === "storefront"}
                onDownload={() => handleDownload("storefront", `enkore-storefront-${slugifyForFilename(storefrontUrl)}.png`)}
              />
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mt-4 max-w-xs">
                <p className="text-xs text-orange-800 text-center">Fans scan this to land on your full storefront — all your music and merch in one place.</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tracks">
            {tracks.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tracks uploaded yet</p>
                <p className="text-sm text-gray-400 mt-1">Upload a track to generate its QR code.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {tracks.map((track) => {
                  const key = `track-${track.id}`;
                  const filename = `enkore-track-${slugifyForFilename(track.title)}.png`;
                  return (
                    <QRPreview
                      key={track.id}
                      value={`${storefrontFullUrl}?tab=music`}
                      label={track.title}
                      sublabel={`Digital · ${track.genre || "Music"}`}
                      onContainerRef={(el) => {
                        containerEls.current[key] = el;
                      }}
                      downloading={downloadingKey === key}
                      onDownload={() => handleDownload(key, filename)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="merch">
            {merch.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingBag className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No merchandise added yet</p>
                <p className="text-sm text-gray-400 mt-1">Add merch to generate QR codes for physical products.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {merch.map((item) => {
                  const key = `merch-${item.id}`;
                  const filename = `enkore-merch-${slugifyForFilename(item.name)}.png`;
                  return (
                    <QRPreview
                      key={item.id}
                      value={`${storefrontFullUrl}?tab=merch`}
                      label={item.name}
                      sublabel={`Physical · ${item.type || "Merch"}`}
                      onContainerRef={(el) => {
                        containerEls.current[key] = el;
                      }}
                      downloading={downloadingKey === key}
                      onDownload={() => handleDownload(key, filename)}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
