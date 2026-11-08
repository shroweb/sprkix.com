"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, ChevronRight } from "lucide-react";
import { ALL_NAV } from "./nav";

export default function AdminTopBar({ name, role }: { name: string; role: string }) {
  const pathname = usePathname() ?? "/admin";
  const parts = pathname.split("/").filter(Boolean).slice(1); // drop "admin"
  const crumbs = parts.map((seg, i) => {
    const href = "/admin/" + parts.slice(0, i + 1).join("/");
    const nav = ALL_NAV.find((n) => n.href === href);
    const label = nav?.label ?? (seg.length > 18 ? "Details" : seg.replace(/-/g, " "));
    return { href, label };
  });

  const openPalette = () =>
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }));

  return (
    <header className="h-16 shrink-0 bg-background/85 backdrop-blur border-b border-border pl-16 pr-4 md:px-8 flex items-center justify-between sticky top-0 z-30">
      <nav className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider min-w-0">
        <Link href="/admin" className="text-muted-foreground hover:text-foreground">Admin</Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1.5 min-w-0">
            <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
            {i === crumbs.length - 1 ? (
              <span className="text-foreground truncate capitalize">{c.label}</span>
            ) : (
              <Link href={c.href} className="text-muted-foreground hover:text-foreground truncate capitalize">{c.label}</Link>
            )}
          </span>
        ))}
      </nav>

      <div className="flex items-center gap-4 shrink-0">
        <button
          onClick={openPalette}
          className="flex items-center gap-2 text-xs font-semibold text-muted-foreground bg-card hover:text-foreground border border-border px-3 py-2"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Search or jump to…</span>
          <kbd className="font-mono text-[10px] border border-border px-1.5 py-0.5 text-slate-500">⌘K</kbd>
        </button>
        <div className="hidden sm:flex items-center gap-3">
          <div className="w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center text-sm font-black">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="leading-none">
            <p className="text-sm font-bold">{name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
