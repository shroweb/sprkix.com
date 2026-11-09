"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Crown, Trophy, User } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/events", label: "Events", icon: Calendar, match: (p: string) => p.startsWith("/events") },
  { href: "/champions", label: "Champs", icon: Crown, match: (p: string) => p.startsWith("/champions") || p.startsWith("/lineal") },
  { href: "/leaderboard", label: "Rank", icon: Trophy, match: (p: string) => p.startsWith("/leaderboard") || p.startsWith("/rankings") },
];

/** Phone-only bottom navigation. Event pages have their own action bar, so it steps aside there. */
export default function MobileTabBar({ signedIn }: { signedIn: boolean }) {
  const pathname = usePathname() || "/";
  if (/^\/events\/[^/]+/.test(pathname) || /^\/(login|register|forgot-password|reset-password)/.test(pathname)) return null;

  const tabs = [
    ...TABS,
    {
      href: signedIn ? "/profile" : "/login",
      label: signedIn ? "Profile" : "Sign in",
      icon: User,
      match: (p: string) => p.startsWith("/profile") || p.startsWith("/login") || p.startsWith("/users"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={label}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-1 py-2.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  active ? "text-primary" : "text-muted-foreground active:text-foreground"
                }`}
              >
                {active && <span className="absolute inset-x-5 top-0 h-0.5 bg-primary" />}
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
