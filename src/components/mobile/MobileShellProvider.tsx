"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

export type MobileRole = "member" | "musician" | "partner";

type ShellState = {
  role: MobileRole;
  isSignedIn: boolean;
  hasMusicianProfile: boolean;
  hasAffiliateProfile: boolean;
  toggleRole: () => void;
};

const ShellContext = createContext<ShellState | null>(null);

export function useMobileShell(): ShellState {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useMobileShell must be used within MobileShellProvider");
  return ctx;
}

// Role state lives in plain component state, not a cookie/localStorage —
// it doesn't need to survive a full reload (defaulting back to Member on
// reload is fine), and it doesn't remount on navigation between /m/* pages
// since this provider sits in the shared layout, not per-page. isSignedIn,
// hasMusicianProfile, and hasAffiliateProfile are all resolved
// server-side (src/app/m/layout.tsx) and passed in as props, not
// re-derived client-side.
//
// Three roles now cycle member -> musician -> partner -> member on each
// tap, rather than the original two-way toggle — Partner is a genuine
// third role per the mobile app plan, not a sub-mode of either of the
// other two. A musician who isn't yet a partner (or vice versa) gets
// routed to that role's own pitch/signup screen, same pattern the
// original member->musician gate already used.
export default function MobileShellProvider({
  isSignedIn,
  hasMusicianProfile,
  hasAffiliateProfile,
  children,
}: {
  isSignedIn: boolean;
  hasMusicianProfile: boolean;
  hasAffiliateProfile: boolean;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [role, setRole] = useState<MobileRole>("member");

  const toggleRole = () => {
    if (!isSignedIn) {
      router.push("/m/signin");
      return;
    }
    if (role === "member") {
      if (!hasMusicianProfile) {
        router.push("/m/musician/why");
        return;
      }
      setRole("musician");
      router.push("/m/dash");
      return;
    }
    if (role === "musician") {
      if (!hasAffiliateProfile) {
        router.push("/m/partner/why");
        return;
      }
      setRole("partner");
      router.push("/m/partner");
      return;
    }
    setRole("member");
    router.push("/m");
  };

  return (
    <ShellContext.Provider value={{ role, isSignedIn, hasMusicianProfile, hasAffiliateProfile, toggleRole }}>
      {children}
    </ShellContext.Provider>
  );
}
