"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Disc3, Library, Ticket, User, LayoutDashboard, Users, Wallet } from "lucide-react";
import { useMobileShell } from "./MobileShellProvider";

// Nav items switch with the role, per the design's slide 13 ("the hinge of
// the whole app"). Partner nav (Partner/Activity/Payout/Profile) is Phase
// 7 — no partner-role detection exists yet, so this file only knows about
// Member and Musician for now.
const MEMBER_NAV = [
  { href: "/m", label: "Home", icon: Home },
  { href: "/m/musicians", label: "Musicians", icon: Disc3 },
  { href: "/m/library", label: "Library", icon: Library },
  { href: "/m/tickets", label: "Tickets", icon: Ticket },
  { href: "/m/profile", label: "Profile", icon: User },
];

const MUSICIAN_NAV = [
  { href: "/m/dash", label: "Studio", icon: LayoutDashboard },
  { href: "/m/community", label: "Community", icon: Users },
  { href: "/m/money", label: "Money", icon: Wallet },
  { href: "/m/profile", label: "Profile", icon: User },
];

// Pre-auth routes get no bottom nav — Library/Tickets/Profile are dead
// ends for a signed-out visitor, and the join/sign-in flows want full
// attention anyway.
const NO_NAV_PREFIXES = ["/m/join", "/m/signin"];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { role } = useMobileShell();
  if (NO_NAV_PREFIXES.some((p) => pathname.startsWith(p))) return null;

  const items = role === "musician" ? MUSICIAN_NAV : MEMBER_NAV;

  return (
    <nav
      className={`sticky bottom-0 z-20 grid border-t-2 ${items.length === 5 ? "grid-cols-5" : "grid-cols-4"}`}
      style={{ background: "var(--m-ground)", borderColor: "var(--m-line)" }}
    >
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/m" || href === "/m/dash" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex min-h-14 flex-col items-center justify-center gap-1 py-2 text-[10px] font-semibold"
            style={{ color: active ? "var(--m-accent)" : "var(--m-text-muted)" }}
          >
            <Icon className="h-[18px] w-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
