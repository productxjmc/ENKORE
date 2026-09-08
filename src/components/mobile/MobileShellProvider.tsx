"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";

export type MobileRole = "member" | "musician";

type ShellState = {
  role: MobileRole;
  isSignedIn: boolean;
  hasMusicianProfile: boolean;
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
// since this provider sits in the shared layout, not per-page. isSignedIn
// and hasMusicianProfile are resolved server-side (src/app/m/layout.tsx)
// and passed in as props, not re-derived client-side.
export default function MobileShellProvider({
  isSignedIn,
  hasMusicianProfile,
  children,
}: {
  isSignedIn: boolean;
  hasMusicianProfile: boolean;
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
    } else {
      setRole("member");
      router.push("/m");
    }
  };

  return (
    <ShellContext.Provider value={{ role, isSignedIn, hasMusicianProfile, toggleRole }}>
      {children}
    </ShellContext.Provider>
  );
}
