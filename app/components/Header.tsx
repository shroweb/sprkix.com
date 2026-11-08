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

  const navClass = (href: string) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return `relative whitespace-nowrap rounded-lg px-2 py-2 text-sm font-semibold transition-colors after:absolute after:inset-x-2 after:-bottom-0.5 after:h-0.5 after:rounded-full after:bg-primary after:transition-transform ${
      active
        ? "text-primary after:scale-x-100"
        : "text-foreground/80 hover:text-primary after:scale-x-0"
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
            : "bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent backdrop-blur-md py-4 sm:py-5"
        }`}
      >
        {showBanner && (
          <div className="w-full px-4 sm:px-6 pb-3">
            <a
              href={bannerLink?.trim() || "#"}
              target={bannerLink?.trim()?.startsWith("http") ? "_blank" : undefined}
              rel={bannerLink?.trim()?.startsWith("http") ? "noopener noreferrer" : undefined}
              className="mx-auto max-w-7xl block rounded-2xl bg-primary text-black px-5 py-3 text-center text-xs sm:text-sm font-black uppercase tracking-wider hover:bg-[var(--primary-hover)] transition-colors"
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
          <nav className="hidden md:flex items-center gap-3 lg:gap-6 shrink-0">
            <Link href="/events" className={navClass("/events")}>
              Events
            </Link>
            <Link href="/promotions" className={navClass("/promotions")}>
              Promotions
            </Link>
            <Link href="/wrestlers" className={navClass("/wrestlers")}>
              Wrestlers
            </Link>
            <Link href="/lists" className={navClass("/lists")}>
              Lists
            </Link>
            <Link href="/news" className={navClass("/news")}>
              News
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors py-2 whitespace-nowrap">
                Discover
                <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all group-hover:rotate-180" />
              </button>
              <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0 w-52 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 z-50">
                <Link href="/matches/finder" className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors">
                  Match Finder
                </Link>
                <Link href="/rankings" className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors">
                  Top Events
                </Link>
                <Link href="/matches/top" className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors">
                  Top Matches
                </Link>
                <Link href="/leaderboard" className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors">
                  Predictions Leaderboard
                </Link>
                <Link href="/lineal" className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors">
                  Lineal Titles
                </Link>
              </div>
            </div>

            <SearchModal />

            <div className="h-6 w-[1px] bg-border mx-2"></div>

            {user ? (
              <div className="flex items-center gap-4">
                <Link href="/feed" title="Feed" className="hover:text-primary transition-colors">
                  <Rss className="w-5 h-5" />
                </Link>
                <NotificationBell />
                {user.isAdmin && (
                  <Link href="/admin" className="text-sm font-semibold flex items-center gap-2 text-primary hover:opacity-80 transition-opacity">
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <div className="flex items-center gap-3 bg-secondary p-1 pr-4 rounded-full border border-border hover:bg-muted transition-colors cursor-pointer group relative">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || "Avatar"} className="w-8 h-8 rounded-full object-cover shrink-0" />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${getHeaderGradient(user.name || "user")[0]}, ${getHeaderGradient(user.name || "user")[1]})` }}
                    >
                      {(user.name || "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-sm font-bold truncate max-w-[100px]">{user.name}</span>

                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                    <Link href="/profile" className="flex items-center gap-3 p-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors">
                      <User className="w-4 h-4" /> Profile
                    </Link>
                    <Link href="/watchlist" className="flex items-center gap-3 p-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors">
                      <Bookmark className="w-4 h-4" /> Watchlist
                    </Link>
                    <button onClick={logout} className="w-full flex items-center gap-3 p-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <Link href="/login" className="text-sm font-bold opacity-80 hover:opacity-100 hover:text-primary transition-all">
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
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
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
              <span className="block px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
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
              <span className="block px-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-2">
                Discover & Rankings
              </span>
              <Link href="/matches/finder" className="flex items-center justify-between rounded-2xl px-4 py-3 text-base font-bold text-slate-100 hover:bg-white/5 hover:text-primary transition-colors" onClick={() => setMenuOpen(false)}>
                <span>Match Finder</span>
                <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">Tool</span>
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
