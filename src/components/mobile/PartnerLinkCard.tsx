"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://enkoremusic.africa";

export default function PartnerLinkCard({ referralCode }: { referralCode: string }) {
  const [copied, setCopied] = useState(false);
  const referralLink = `${APP_URL}/musician-pre-register?ref=${referralCode}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({ title: "Join ENKORE", text: "Join the founding community of African Christian musicians:", url: referralLink });
    } else {
      copyLink();
    }
  };

  return (
    <div className="border-2 p-4" style={{ borderColor: "var(--m-line)" }}>
      <p className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: "var(--m-accent)" }}>Your partner link</p>
      <p className="mt-2 truncate text-[12px]" style={{ color: "var(--m-text-muted)" }}>{referralLink}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={copyLink} className="flex min-h-11 flex-1 items-center justify-center gap-2 border-2 text-[12px] font-bold" style={{ borderColor: "var(--m-line)" }}>
          {copied ? <><Check className="h-4 w-4" style={{ color: "#1a7f37" }} /> Copied</> : <><Copy className="h-4 w-4" /> Copy</>}
        </button>
        <button type="button" onClick={shareLink} className="flex min-h-11 flex-1 items-center justify-center gap-2 text-[12px] font-bold text-white" style={{ background: "var(--m-accent)" }}>
          <Share2 className="h-4 w-4" /> Share
        </button>
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color: "var(--m-accent)" }}>Referral code</p>
      <p className="mt-1 text-[20px] font-extrabold tracking-[0.1em]">{referralCode}</p>
    </div>
  );
}
