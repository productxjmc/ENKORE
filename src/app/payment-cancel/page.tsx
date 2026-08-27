"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { XCircle, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// Ported from src/pages/PaymentCancel.jsx — Payfast's cancel_url target.
export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <div className="min-h-full bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardHeader className="text-center bg-gradient-to-r from-red-500 to-red-600 text-white rounded-t-lg">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
          <CardTitle className="text-3xl">Payment Cancelled</CardTitle>
          <CardDescription className="text-red-100 text-lg">Your payment was not completed</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-gray-700 text-center">No charges were made to your account. You can try again whenever you&apos;re ready.</p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={() => router.back()}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Try Again
            </Button>
            <Link href="/" className="block">
              <Button variant="outline" className="w-full">
                <Home className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
