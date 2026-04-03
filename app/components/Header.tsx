"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
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

  const showBanner = !!bannerEnabled && !!bannerText?.trim();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/80 backdrop-blur-xl border-b border-border py-4 shadow-2xl"
          : // Give the nav its own readable fade without smothering the hero image.
            "bg-gradient-to-b from-background/85 via-background/35 to-transparent backdrop-blur-md py-6"
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
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt="Logo"
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
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          <Link
            href="/events"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Events
          </Link>
          <Link
            href="/promotions"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Promotions
          </Link>
          <Link
            href="/wrestlers"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Wrestlers
          </Link>
          <Link
            href="/lists"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Lists
          </Link>
          <Link
            href="/news"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            News
          </Link>
          <div className="relative group">
            <button
              className="flex items-center gap-1 text-sm font-semibold hover:text-primary transition-colors py-2"
            >
              Rankings
              <ChevronDown className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-all group-hover:rotate-180" />
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 top-full mt-0 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0 z-50">
              <Link
                href="/rankings"
                className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors uppercase italic"
              >
                Top Events
              </Link>
              <Link
                href="/matches/top"
                className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors uppercase italic"
              >
                Top Matches
              </Link>
              <Link
                href="/leaderboard"
                className="flex items-center gap-3 p-3 text-sm font-bold hover:bg-muted rounded-xl transition-colors uppercase italic"
              >
                Predictions
              </Link>
            </div>
          </div>

          <SearchModal />

          <div className="h-6 w-[1px] bg-border mx-2"></div>

          {user ? (
            <div className="flex items-center gap-4">
              <Link
                href="/feed"
                title="Feed"
                className="hover:text-primary transition-colors"
              >
                <Rss className="w-5 h-5" />
              </Link>
              <NotificationBell />
              {user.isAdmin && (
                <Link
                  href="/admin"
                  className="text-sm font-semibold flex items-center gap-2 text-primary hover:opacity-80 transition-opacity"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3 bg-secondary p-1 pr-4 rounded-full border border-border hover:bg-muted transition-colors cursor-pointer group relative">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "Avatar"}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs font-black text-white shadow-sm"
                    style={{ background: `linear-gradient(135deg, ${getHeaderGradient(user.name || "user")[0]}, ${getHeaderGradient(user.name || "user")[1]})` }}
                  >
                    {(user.name || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-sm font-bold truncate max-w-[100px]">
                  {user.name}
                </span>

                {/* Dropdown Simulation on Hover/Click could go here */}
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all translate-y-2 group-hover:translate-y-0">
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 p-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <Link
                    href="/watchlist"
                    className="flex items-center gap-3 p-3 text-sm font-medium hover:bg-muted rounded-xl transition-colors"
                  >
                    <Bookmark className="w-4 h-4" /> Watchlist
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 p-3 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-6">
              <Link
                href="/login"
                className="text-sm font-bold opacity-80 hover:opacity-100 hover:text-primary transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="btn-primary py-2.5 px-6 text-sm shadow-xl shadow-primary/20"
              >
                Join Poison Rana
              </Link>
            </div>
          )}
        </nav>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 bg-secondary rounded-lg"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-background border-b border-border p-6 animate-in slide-in-from-top-4 duration-300 shadow-2xl">
          <nav className="flex flex-col gap-6">
            <Link href="/events" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
              Events
            </Link>
            <Link href="/promotions" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
              Promotions
            </Link>
            <Link href="/wrestlers" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
              Wrestlers
            </Link>
            <Link href="/lists" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
              Lists
            </Link>
            <Link href="/news" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
              News
            </Link>
            <div className="space-y-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Rankings
              </span>
              <Link href="/rankings" className="block text-lg font-bold pl-2" onClick={() => setMenuOpen(false)}>
                Top Events
              </Link>
              <Link href="/matches/top" className="block text-lg font-bold pl-2" onClick={() => setMenuOpen(false)}>
                Top Matches
              </Link>
              <Link href="/leaderboard" className="block text-lg font-bold pl-2" onClick={() => setMenuOpen(false)}>
                Predictions Leaderboard
              </Link>
            </div>
            <hr className="border-border" />
            {user ? (
              <>
                <Link href="/feed" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
                  My Feed
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin"
                    className="text-lg font-bold text-primary"
                    onClick={() => setMenuOpen(false)}
                  >
                    Admin Dashboard
                  </Link>
                )}
                <Link href="/profile" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
                  My Profile
                </Link>
                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="text-left text-lg font-bold text-destructive"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-lg font-bold" onClick={() => setMenuOpen(false)}>
                  Login
                </Link>
                <Link href="/register" className="btn-primary text-center" onClick={() => setMenuOpen(false)}>
                  Join Poison Rana
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
