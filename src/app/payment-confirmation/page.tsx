"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// Ported from src/pages/PaymentConfirmation.jsx — this is Kyshi's
// redirectUrl target (see the initialize route), not a Payfast page: it
// calls verifyKyshiTransaction-equivalent logic via reference, which only
// Kyshi's redirect-based checkout needs (Payfast relies on its webhook +
// PaymentSuccess instead).
type Status = "loading" | "success" | "failed" | "error";

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference") || searchParams.get("ref") || searchParams.get("trxref");

  const [status, setStatus] = useState<Status>("loading");
  const [transactionData, setTransactionData] = useState<{ amount?: number; localCurrency?: string; email?: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!reference) {
      setStatus("error");
      setErrorMessage("No payment reference found in the URL.");
      return;
    }

    (async () => {
      try {
        const res = await fetch("/api/payments/kyshi/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });
        const data = await res.json();

        if (data?.status === "successful") {
          setTransactionData(data.data ?? null);
          setStatus("success");
        } else {
          setStatus("failed");
          setErrorMessage(data?.error || "Payment could not be verified.");
        }
      } catch {
        setStatus("error");
        setErrorMessage("An error occurred while verifying your payment.");
      }
    })();
  }, [reference]);

  return (
    <div className="min-h-full bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center pb-2">
          {status === "loading" && (
            <>
              <div className="flex justify-center mb-4">
                <Loader2 className="w-14 h-14 text-orange-500 animate-spin" />
              </div>
              <CardTitle className="text-xl">Verifying Payment...</CardTitle>
              <CardDescription>Please wait while we confirm your transaction.</CardDescription>
            </>
          )}

          {status === "success" && (
            <>
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="w-14 h-14 text-green-500" />
              </div>
              <CardTitle className="text-xl text-green-700">Payment Successful!</CardTitle>
              <CardDescription>Your payment has been confirmed.</CardDescription>
            </>
          )}

          {(status === "failed" || status === "error") && (
            <>
              <div className="flex justify-center mb-4">
                <XCircle className="w-14 h-14 text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-700">Payment Failed</CardTitle>
              <CardDescription>{errorMessage || "Your payment was not completed successfully."}</CardDescription>
            </>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {transactionData && status === "success" && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2 text-sm">
              {reference && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Reference</span>
                  <span className="font-medium text-gray-800 break-all text-right max-w-[60%]">{reference}</span>
                </div>
              )}
              {transactionData.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-medium text-gray-800">
                    {transactionData.localCurrency ?? ""} {Number(transactionData.amount).toLocaleString()}
                  </span>
                </div>
              )}
              {transactionData.email && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Email</span>
                  <span className="font-medium text-gray-800">{transactionData.email}</span>
                </div>
              )}
            </div>
          )}

          {reference && status !== "success" && status !== "loading" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
              <span className="text-gray-500">Reference: </span>
              <code className="text-gray-700 break-all">{reference}</code>
            </div>
          )}

          {status === "success" && (
            <p className="text-sm text-gray-500 text-center">A confirmation has been sent to your email. You can now download your track.</p>
          )}
          {status === "failed" && <p className="text-sm text-gray-500 text-center">Please try again or contact support if the issue persists.</p>}

          {status !== "loading" && (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/" className="block">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-gradient-to-br from-orange-50 to-gray-100 flex items-center justify-center p-6">
          <Loader2 className="w-14 h-14 text-orange-500 animate-spin" />
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
