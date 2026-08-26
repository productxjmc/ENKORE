import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

// Ported from the Base44 app's src/pages/MusicianPreRegistrationSuccess.jsx.
// Review window updated from "2-3 business days" to "7 to 21 working days"
// per the standing decision that superseded every conflicting figure across
// the old docs/code (see memory: project-application-response-time).
const FOUNDERS = [
  { name: "Jermaine M. Charles", role: "Co-founder & Managing Director" },
  { name: "David C. Vermaak", role: "Co-founder & Director" },
  { name: "Hadley M. Schoeman", role: "Assistant Finance Manager" },
];

export default function MusicianPreRegistrationSuccessPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-black text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-white font-black text-xl tracking-tight">
            ENKORE
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl text-center">
            <CardContent className="p-8 md:p-12">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">Thank You for Registering! 🎉</h1>
              <p className="text-lg text-gray-700 mb-6">
                Your pre-registration application has been successfully submitted. We&apos;re excited to review it and will be in
                touch shortly.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 mb-8 text-left">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-orange-600 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-bold text-orange-900 mb-2">What happens next?</h3>
                    <ul className="text-sm text-orange-800 space-y-2">
                      <li>• Our team will review your application within 7 to 21 working days</li>
                      <li>• We&apos;ll send you an email with the outcome</li>
                      <li>• If approved, you&apos;ll receive a link to complete your full registration</li>
                      <li>• You&apos;ll then be able to upload tracks, set up your storefront, and start selling!</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
                <p className="text-md text-gray-700 mb-4">The ENKORE team is dedicated to empowering African musicians.</p>
                <div className="text-left">
                  <p className="text-lg font-semibold text-black mb-3">Our Team:</p>
                  <ul className="space-y-2">
                    {FOUNDERS.map((founder) => (
                      <li key={founder.name} className="text-gray-700">
                        <span className="font-medium">{founder.name}</span>
                        <span className="text-gray-500 text-sm"> - {founder.role}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <Link href="/">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-8 py-3 text-lg">
                  Return to Home
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      <footer className="bg-black text-white py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">© 2025 Fanbase Africa (Pty) Ltd. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
