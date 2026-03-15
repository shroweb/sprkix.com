"use client";

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
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/events", label: "Events", icon: Calendar },
    { href: "/admin/wrestlers", label: "Wrestlers", icon: Users },
    { href: "/admin/promotions", label: "Promotions", icon: Tag },
    { href: "/admin/users", label: "User Manager", icon: Users },
    { href: "/admin/media", label: "Media Library", icon: Image },
    { href: "/admin/settings", label: "Site Settings", icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-border min-h-screen flex flex-col sticky top-0 z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <Star className="w-5 h-5 text-primary-foreground fill-current" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tighter leading-none italic uppercase">
              Poison Rana
            </span>
            <span className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em]">
              Foundation
            </span>
          </div>
        </div>
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
              { href: "/admin/wrestlers", label: "Wrestlers", icon: Users },
              { href: "/admin/promotions", label: "Promotions", icon: Tag },
              { href: "/admin/users", label: "User Manager", icon: Users },
              { href: "/admin/reviews", label: "Review Browser", icon: LogOut }, // Using LogOut as placeholder for Reviews icon if Star is missing
              { href: "/admin/import", label: "Import Queue", icon: Download },
              { href: "/admin/polls", label: "Polls", icon: BarChart2 },
            ].map((link) => {
              const Icon = link.icon === LogOut ? Star : link.icon;
              const isActive = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
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
              { href: "/admin/activity", label: "Activity Feed", icon: LogOut },
              { href: "/admin/audit", label: "Content Audit", icon: ShieldAlert },
              { href: "/admin/duplicates", label: "Duplicate Finder", icon: Search },
              { href: "/admin/health", label: "Image Health", icon: Activity },
            ].map((link) => {
              const Icon = link.icon === LogOut ? Activity : link.icon;
              const isActive = pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
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
            Foundation Tools
          </p>
          <div className="space-y-1">
            {[
              { href: "/admin/scraper", label: "Metadata Scraper", icon: Search },
              { href: "/admin/bulk-tag", label: "Bulk Tagger", icon: Tag },
              { href: "/admin/matches", label: "Card Drafts", icon: Calendar },
              { href: "/admin/moderation", label: "Moderation Queue", icon: ShieldAlert },
              { href: "/admin/notes", label: "Admin Scratchpad", icon: Settings },
              { href: "/admin/maintenance", label: "System Control", icon: Settings },
            ].map((link) => {
              const Icon = link.icon;
              const isActive = pathname?.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
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
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-red-500 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Exit Admin
          </Link>
        </div>
      </div>
    </aside>
  );
}
