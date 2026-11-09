"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  User,
  LogOut,
  Star,
  LayoutDashboard,
  Bookmark,
  ChevronDown,
  Rss,
  Search as SearchIcon,
  BarChart3,
  Swords,
  Trophy,
  Crown,
  Award,
} from "lucide-react";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";

const HEADER_GRADIENTS = [
  ["#7c3aed", "#4f46e5"],
  ["#db2777", "#9d174d"],
  ["#ea580c", "#b45309"],
  ["#059669", "#0d9488"],
  ["#0284c7", "#1d4ed8"],
  ["#c026d3", "#7e22ce"],
  ["#65a30d", "#047857"],
  ["#0891b2", "#1e40af"],
  ["#dc2626", "#9f1239"],
  ["#7c3aed", "#be185d"],
  ["#d97706", "#dc2626"],
  ["#0284c7", "#059669"],
];

function getHeaderGradient(seed: string): [string, string] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return HEADER_GRADIENTS[Math.abs(hash) % HEADER_GRADIENTS.length] as [string, string];
}

const iconBtn =
  "grid h-9 w-9 place-items-center rounded-lg text-foreground/80 transition-colors hover:bg-white/5 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const DISCOVER_ITEMS = [
  { href: "/matches/finder", label: "Match Finder", hint: "Search matches by wrestler, rating or type", Icon: SearchIcon },
  { href: "/rankings", label: "Top Events", hint: "The highest-rated shows of all time", Icon: BarChart3 },
  { href: "/matches/top", label: "Top Matches", hint: "Fan-ranked best matches", Icon: Swords },
  { href: "/leaderboard", label: "Predictions Leaderboard", hint: "Who calls the winners best", Icon: Trophy },
  { href: "/lineal", label: "Lineal Titles", hint: "Unbroken championship lineages", Icon: Crown },
  { href: "/champions", label: "Current Champions", hint: "Every reigning titleholder", Icon: Award },
];

const logoSizeMap: Record<string, string> = {
  sm: "h-8",
  md: "h-12",
  lg: "h-16",
  xl: "h-24",
};

export default function Header({
  user,
  siteLogo,
  logoSize,
  bannerEnabled,
  bannerText,
  bannerLink,
}: {
  user: any;
  siteLogo?: string;
  logoSize?: string;
  bannerEnabled?: boolean;
  bannerText?: string;
  bannerLink?: string;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  const showBanner = !!bannerEnabled && !!bannerText?.trim();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const discoverActive = DISCOVER_ITEMS.some((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));

  const navClass = (href: string, forceActive?: boolean) => {
    const active = forceActive ?? (pathname === href || pathname.startsWith(`${href}/`));
    return `relative whitespace-nowrap rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform ${
      active
        ? "text-primary after:scale-x-100"
        : "text-foreground/85 hover:bg-white/5 hover:text-foreground after:scale-x-0"
    }`;
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className={`transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 py-3 shadow-xl"
            : "bg-gradient-to-b from-slate-950 via-slate-950/85 to-slate-950/20 backdrop-blur-md py-4 sm:py-5"
        }`}
      >
        {showBanner && (
          <div className="w-full px-4 sm:px-6 pb-3">
            <a
              href={bannerLink?.trim() || "#"}
              target={bannerLink?.trim()?.startsWith("http") ? "_blank" : undefined}
              rel={bannerLink?.trim()?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mx-auto max-w-7xl block rounded-2xl bg-primary text-black px-5 py-3 text-center text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-colors"
              onClick={(e) => {
                if (!bannerLink?.trim()) e.preventDefault();
              }}
            >
              {bannerText}
            </a>
          </div>
        )}
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" aria-label="Poison Rana home" className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Poison Rana"
                className={`${logoSizeMap[logoSize || "md"] ?? "h-12"} w-auto object-contain group-hover:scale-105 transition-transform`}
              />
            ) : (
              <>
                <div className="bg-primary p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                  <Star className="w-5 h-5 text-primary-foreground fill-current" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-foreground">
                  Poison Rana
                </span>
              </>
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 shrink-0" aria-label="Primary">
            <Link href="/events" className={navClass("/events")}>Events</Link>
            <Link href="/promotions" className={navClass("/promotions")}>Promotions</Link>
            <Link href="/wrestlers" className={navClass("/wrestlers")}>Wrestlers</Link>
            <Link href="/lists" className={navClass("/lists")}>Lists</Link>
            <Link href="/news" className={navClass("/news")}>News</Link>

            {/* Discover dropdown: hover + keyboard (focus-within) */}
            <div className="relative group">
              <button
                type="button"
                aria-haspopup="menu"
                className={`${navClass("/__discover__", discoverActive)} flex items-center gap-1`}
              >
                Discover
                <ChevronDown className="h-4 w-4 opacity-60 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
              </button>
              <div className="invisible absolute left-1/2 top-full z-50 w-72 -translate-x-1/2 translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <div role="menu" className="rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/50">
                  {DISCOVER_ITEMS.map(({ href, label, hint, Icon }) => {
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={href}
                        href={href}
                        role="menuitem"
                        className={`flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-white/5 focus-visible:bg-white/5 focus-visible:outline-none ${active ? "bg-white/[0.04]" : ""}`}
                      >
                        <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border ${active ? "border-primary/40 bg-primary/10 text-primary" : "border-white/10 bg-white/5 text-primary"}`}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-sm font-bold text-foreground">{label}</span>
                          <span className="block text-xs leading-snug text-muted-foreground">{hint}</span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <SearchModal />

            <div className="mx-2 h-6 w-px bg-white/10" aria-hidden />

            {user ? (
              <div className="flex items-center gap-1.5">
                <Link href="/feed" title="Feed" aria-label="Feed" className={iconBtn}>
                  <Rss className="h-5 w-5" />
                </Link>
                <NotificationBell />
                {user.isAdmin && (
                  <Link href="/admin" className="ml-1 flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20">
                    <LayoutDashboard className="h-4 w-4" />
                    Admin
                  </Link>
                )}
                <div className="group relative ml-1">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/[0.04] py-1 pl-1 pr-3 transition-colors hover:border-white/20 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-8 w-8 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                        style={{ background: `linear-gradient(135deg, ${getHeaderGradient(user.name || "user")[0]}, ${getHeaderGradient(user.name || "user")[1]})` }}
                      >
                        {(user.name || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[110px] truncate text-sm font-semibold">{user.name}</span>
                    <ChevronDown className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:rotate-180 group-focus-within:rotate-180" />
                  </Link>
                  <div className="invisible absolute right-0 top-full z-50 w-52 translate-y-1 pt-2 opacity-0 transition-all group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="rounded-xl border border-white/10 bg-slate-950 p-2 shadow-2xl shadow-black/50">
                      <Link href="/profile" className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-colors hover:bg-white/5">
                        <User className="h-4 w-4 text-primary" /> Profile
                      </Link>
                      <Link href="/watchlist" className="flex items-center gap-3 rounded-lg p-2.5 text-sm font-medium transition-colors hover:bg-white/5">
                        <Bookmark className="h-4 w-4 text-primary" /> Watchlist
                      </Link>
                      <div className="my-1 h-px bg-white/10" />
                      <button onClick={logout} className="flex w-full items-center gap-3 rounded-lg p-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                        <LogOut className="h-4 w-4" /> Logout
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="rounded-lg px-3 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-white/5 hover:text-primary">
                  Login
                </Link>
                <Link href="/register" className="btn-primary py-2.5 px-6 text-sm shadow-xl shadow-primary/20">
                  Join Poison Rana
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Header Action Group */}
          <div className="flex items-center gap-2 md:hidden">
            <SearchModal className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-secondary text-foreground transition-colors hover:border-primary/30 hover:text-primary" />
            {user && <NotificationBell />}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-navigation"
              className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-secondary text-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay Menu */}
      {menuOpen && (
        <div id="mobile-navigation" className="fixed inset-x-0 top-[65px] bottom-0 z-50 overflow-y-auto border-b border-white/10 bg-slate-950 p-5 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200 md:hidden">
          <nav className="mx-auto flex max-w-lg flex-col gap-5">
            {/* User Profile Summary (Mobile) */}
            {user ? (
              <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-primary/30 shrink-0" />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-black text-white shadow-md shrink-0"
                      style={{ background: `linear-gradient(135deg, ${getHeaderGradient(user.name || "user")[0]}, ${getHeaderGradient(user.name || "user")[1]})` }}
                    >
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-black text-white truncate">{user.name}</p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-primary">
                      {user.isAdmin ? "Administrator" : "Community Member"}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/10">
                  <Link href="/profile" className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                    <User className="w-3.5 h-3.5 text-primary" /> Profile
                  </Link>
                  <Link href="/watchlist" className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                    <Bookmark className="w-3.5 h-3.5 text-primary" /> Watchlist
                  </Link>
                  <Link href="/feed" className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-200 hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                    <Rss className="w-3.5 h-3.5 text-primary" /> My Feed
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/10 text-xs font-bold text-primary hover:bg-primary/20 transition-colors" onClick={() => setMenuOpen(false)}>
                      <LayoutDashboard className="w-3.5 h-3.5" /> Admin
                    </Link>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="flex-1 py-3 text-center rounded-xl border border-white/15 bg-white/5 text-sm font-bold text-white hover:bg-white/10 transition-colors" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="flex-1 py-3 text-center rounded-xl bg-primary text-slate-950 text-sm font-black uppercase italic tracking-wider hover:bg-[var(--primary-hover)] transition-all shadow-lg shadow-primary/20" onClick={() => setMenuOpen(false)}>
                  Join
                </Link>
              </div>
            )}

            {/* Mobile Search Input Trigger */}
            <SearchModal className="w-full flex items-center justify-between gap-3 px-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-slate-300 font-semibold text-sm hover:border-primary/50 transition-colors" />

            {/* Main Section */}
            <div className="space-y-1">
              <span className="block px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Main Menu
              </span>
              <Link href="/events" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                Events
              </Link>
              <Link href="/promotions" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                Promotions
              </Link>
              <Link href="/wrestlers" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                Wrestlers
              </Link>
              <Link href="/lists" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                Lists
              </Link>
              <Link href="/news" className="flex items-center gap-3 rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                News
              </Link>
            </div>

            {/* Discover Section */}
            <div className="space-y-1 border-t border-white/10 pt-4">
              <span className="block px-4 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Discover & Rankings
              </span>
              <Link href="/matches/finder" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Match Finder</span>
                <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">Tool</span>
              </Link>
              <Link href="/rankings" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Top Events</span>
              </Link>
              <Link href="/matches/top" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Top Matches</span>
              </Link>
              <Link href="/leaderboard" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Predictions Leaderboard</span>
              </Link>
              <Link href="/champions" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Current Champions</span>
                <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-amber-400/10 text-amber-400">Belts</span>
              </Link>
              <Link href="/lineal" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Lineal Titles</span>
              </Link>
            </div>

            {user && (
              <div className="border-t border-white/10 pt-3">
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Logout
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
