"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Star, LogOut, Menu, X, ExternalLink } from "lucide-react";
import { NAV, isActive } from "./nav";

export type Badges = Partial<Record<"submissions" | "drafts" | "reports", number>>;

export default function Sidebar({ badges = {} }: { badges?: Badges }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Toggle navigation"
        className="md:hidden fixed top-3 left-3 z-50 p-2.5 bg-card border border-border text-foreground"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>
      {open && <div onClick={() => setOpen(false)} className="md:hidden fixed inset-0 z-40 bg-black/70" />}

      <aside
        className={`fixed md:sticky top-0 z-40 w-60 shrink-0 h-screen bg-[#0a0e18] border-r border-border flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <Link href="/admin" className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
          <div className="bg-primary p-1.5">
            <Star className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <div className="leading-none">
            <div className="text-sm font-black italic uppercase tracking-tight text-foreground">Poison Rana</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground mt-1">Control Room</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {NAV.map((group) => (
            <div key={group.title}>
              <p className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-slate-500/80">{group.title}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(pathname, item.href);
                  const count = item.badge ? badges[item.badge] ?? 0 : 0;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`relative flex items-center justify-between gap-3 pl-3 pr-2.5 py-2 text-[13px] font-semibold transition-colors ${
                        active ? "bg-primary/10 text-primary" : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary" />}
                      <span className="flex items-center gap-3 min-w-0">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] font-black bg-primary text-primary-foreground px-1.5 py-0.5 min-w-[18px] text-center">
                          {count > 99 ? "99+" : count}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-0.5 shrink-0">
          <Link href="/" target="_blank" className="flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-400 hover:text-white hover:bg-white/5">
            <ExternalLink className="w-4 h-4" /> View site
          </Link>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-[13px] font-semibold text-slate-400 hover:text-red-400 hover:bg-white/5">
            <LogOut className="w-4 h-4" /> Exit admin
          </Link>
        </div>
      </aside>
    </>
  );
}
