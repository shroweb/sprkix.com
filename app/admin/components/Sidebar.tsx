"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  LogOut,
  Settings,
  Star,
  ChevronRight,
  Tag,
  Image,
  ShieldAlert,
  Search,
  Activity,
  Download,
  BarChart2,
  Send,
  Smartphone,
  Newspaper,
  Trophy,
  Medal,
  Megaphone,
  ClipboardCheck,
  ScrollText,
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="md:hidden fixed top-3 left-4 z-50 p-2.5 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-800"
      >
        <LayoutDashboard className="w-5 h-5 text-amber-400" />
      </button>

      {/* Overlay for Mobile */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        />
      )}

      <aside
        className={`fixed md:sticky top-0 z-40 w-64 bg-white border-r border-border min-h-screen flex flex-col transition-transform duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
      <div className="p-6">
        <Link href="/admin" className="flex items-center gap-3 mb-8 group">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
            <Star className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter leading-none italic uppercase text-slate-900">
              Poison Rana
            </span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              Foundation
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-8 overflow-y-auto pb-8">
        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">
            Management
          </p>
          <div className="space-y-1">
            {[
              { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
              { href: "/admin/events", label: "Events", icon: Calendar },
              { href: "/admin/championships", label: "Championships", icon: Trophy },
              { href: "/admin/wrestlers", label: "Wrestlers", icon: Users },
              { href: "/admin/promotions", label: "Promotions", icon: Tag },
              { href: "/admin/users", label: "User Manager", icon: Users },
              { href: "/admin/reviews", label: "Review Browser", icon: Star },
              { href: "/admin/news", label: "Newsroom", icon: Newspaper },
              { href: "/admin/submissions", label: "Event Submissions", icon: Send },
              { href: "/admin/import", label: "Import Queue", icon: Download },
              { href: "/admin/polls", label: "Polls", icon: BarChart2 },
              { href: "/admin/badges", label: "Badge Manager", icon: Medal },
              { href: "/admin/broadcast", label: "Broadcast", icon: Megaphone },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"}`} />
                    {link.label}
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">
            Analysis & Ops
          </p>
          <div className="space-y-1">
            {[
              { href: "/admin/analytics", label: "Analytics", icon: Activity },
              { href: "/admin/pulse", label: "Platform Pulse", icon: Activity },
              { href: "/admin/duplicates", label: "Duplicate Finder", icon: Search },
              { href: "/admin/health", label: "Image Health", icon: Activity },
              { href: "/admin/audit", label: "Content Audit", icon: ClipboardCheck },
              { href: "/admin/logs", label: "Admin Log", icon: ScrollText },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"}`} />
                    {link.label}
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] px-4 mb-4">
            Tools & Settings
          </p>
          <div className="space-y-1">
            {[
              { href: "/admin/scraper", label: "Metadata Scraper", icon: Search },
              { href: "/admin/media", label: "Media Library", icon: Image },
              { href: "/admin/moderation", label: "Moderation Queue", icon: ShieldAlert },
              { href: "/admin/settings", label: "Site Settings", icon: Settings },
              { href: "/admin/maintenance", label: "System Control", icon: Settings },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-bold transition-all group ${isActive ? "bg-primary/5 text-primary" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-slate-400 group-hover:text-slate-900"}`} />
                    {link.label}
                  </div>
                  {isActive && <ChevronRight className="w-3 h-3" />}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className="space-y-1">
          <Link
            href="/"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin
          </Link>
        </div>
      </div>
    </aside>
    </>
  );
}
