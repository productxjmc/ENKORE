import Link from "next/link";
import { CheckCircle2, Download, Home, Music } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { withServiceRole } from "@/lib/authContext";
import { formatCurrency } from "@/lib/utils";

// Ported from src/pages/PaymentSuccess.jsx — this is Payfast's return_url
// target (see the initialize route). Polls briefly for the webhook to
// finish (Purchase starts PENDING; the ITN webhook usually lands within a
// second or two) — moved server-side here since there's no client SDK
// standing in for a trusted read the way the original's asServiceRole
// client call did.
//
// Reads the Purchase via withServiceRole rather than the anonymous
// caller's own RLS context deliberately: a guest fan has no session at
// all to match purchase_select's fanEmail/owns_musician checks against,
// yet legitimately needs to see their own purchase. The unguessable
// purchase_id in the URL — which only the payer's own redirect chain ever
// carried — is the access control here, the same trust model the
// original used.
async function loadPurchase(purchaseId: string, attempt = 0): Promise<Awaited<ReturnType<typeof fetchOnce>>> {
  const result = await fetchOnce(purchaseId);
  if (result?.purchase.status === "COMPLETED" || attempt >= 4) return result;
  await new Promise((r) => setTimeout(r, 1500));
  return loadPurchase(purchaseId, attempt + 1);
}

async function fetchOnce(purchaseId: string) {
  return withServiceRole(async (tx) => {
    const purchase = await tx.purchase.findUnique({ where: { id: purchaseId } });
    if (!purchase) return null;
    const track = await tx.track.findUnique({ where: { id: purchase.trackId } });
    const musician = await tx.musician.findUnique({ where: { id: purchase.musicianId } });
    return { purchase, track, musician };
  });
}

export default async function PaymentSuccessPage({ searchParams }: { searchParams: Promise<{ purchase_id?: string }> }) {
  const { purchase_id: purchaseId } = await searchParams;
  const data = purchaseId ? await loadPurchase(purchaseId) : null;
  const { purchase, track, musician } = data ?? {};

  // Gated on the purchase actually being COMPLETED, not just on the track
  // having a file — the original app checked only the latter, so a fan
  // who landed here before the webhook confirmed (or if it never does)
  // would see a working download link for an unpaid purchase. Caught by
  // testing against a real PENDING purchase, not spotted by inspection.
  const downloadUrl = purchase?.status === "COMPLETED" ? track?.audioFileUrl : null;

  return (
    <div className="min-h-full bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-green-500 to-green-600 text-white rounded-t-lg py-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <CardTitle className="text-3xl">Payment Successful!</CardTitle>
          <CardDescription className="text-green-100 text-lg">Thank you for your purchase</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          {purchase && track && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-3">
                {track.coverArt && (
                  // eslint-disable-next-line @next/next/no-img-element -- arbitrary musician-uploaded URL
                  <img src={track.coverArt} alt={track.title} className="w-12 h-12 rounded object-cover" />
                )}
                <div>
                  <p className="font-bold text-gray-900">{track.title}</p>
                  {musician && <p className="text-sm text-gray-500">{musician.musicianName}</p>}
                </div>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
                <span className="text-gray-600">Amount paid</span>
                <span className="font-semibold text-gray-900">{formatCurrency(purchase.amountPaid.toString(), purchase.currency)}</span>
              </div>
            </div>
          )}

          {downloadUrl ? (
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
              <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-base py-6">
                <Download className="w-5 h-5 mr-2" />
                Download Your Track
              </Button>
            </a>
          ) : (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
              <Music className="w-6 h-6 text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-gray-700 font-medium">
                {purchase?.status === "COMPLETED" ? "Download link sent to your email!" : "Still confirming your payment…"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {purchase?.status === "COMPLETED" ? "Check your inbox for the download link." : "This can take a minute — check your email shortly."}
              </p>
            </div>
          )}

          <p className="text-xs text-gray-500 text-center">
            A receipt and download link have also been sent to {purchase?.fanEmail || "your email"}.
          </p>

          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
