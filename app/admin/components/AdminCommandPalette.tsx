"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Calendar, Users, Trophy, Command, CornerDownLeft } from "lucide-react";
import { ALL_NAV } from "./nav";

export default function AdminCommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    events: any[];
    wrestlers: any[];
    users: any[];
    championships: any[];
  }>({ events: [], wrestlers: [], users: [], championships: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ events: [], wrestlers: [], users: [], championships: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults({
          events: data.events || [],
          wrestlers: data.wrestlers || [],
          users: data.users || [],
          championships: [],
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const pageMatches = q
    ? ALL_NAV.filter((n) => `${n.label} ${n.keywords ?? ""}`.toLowerCase().includes(q)).slice(0, 6)
    : [];

  const handleSelect = (url: string) => {
    setOpen(false);
    setQuery("");
    router.push(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-start justify-center pt-20 px-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden text-white animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events, wrestlers, users, admin tools... (Press ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm font-semibold text-white focus:outline-none placeholder-slate-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
            <Command className="w-3 h-3" /> K
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
          {!query.trim() && (
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Quick Shortcuts
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleSelect("/admin/events")}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-amber-400/40 transition-colors flex items-center gap-3"
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Events</p>
                    <p className="text-[10px] text-slate-400">Manage shows & cards</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect("/admin/championships")}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-amber-400/40 transition-colors flex items-center gap-3"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Championships</p>
                    <p className="text-[10px] text-slate-400">Title belts & reigns</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect("/admin/wrestlers")}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-amber-400/40 transition-colors flex items-center gap-3"
                >
                  <Users className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Wrestlers</p>
                    <p className="text-[10px] text-slate-400">Roster & aliases</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSelect("/admin/scraper")}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left hover:border-amber-400/40 transition-colors flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="text-xs font-bold text-white">Metadata Scraper</p>
                    <p className="text-[10px] text-slate-400">Auto-fix posters</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              Searching database...
            </div>
          )}

          {pageMatches.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Admin pages</span>
              {pageMatches.map((n) => (
                <button
                  key={n.href}
                  onClick={() => handleSelect(n.href)}
                  className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 flex items-center justify-between text-left transition-colors"
                >
                  <span className="flex items-center gap-2.5 text-xs font-bold text-white">
                    <n.icon className="w-3.5 h-3.5 text-amber-400" /> {n.label}
                  </span>
                  <CornerDownLeft className="w-3 h-3 text-slate-500" />
                </button>
              ))}
            </div>
          )}

          {query.trim() && !loading && (
            <div className="space-y-4">
              {results.events.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Events
                  </span>
                  {results.events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => handleSelect(`/events/${e.slug}`)}
                      className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl flex items-center justify-between text-left transition-colors"
                    >
                      <span className="text-xs font-bold text-white truncate">{e.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{e.promotion}</span>
                    </button>
                  ))}
                </div>
              )}

              {results.wrestlers.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Wrestlers
                  </span>
                  {results.wrestlers.map((w) => (
                    <button
                      key={w.id}
                      onClick={() => handleSelect(`/wrestlers/${w.slug}`)}
                      className="w-full p-2.5 bg-slate-950 hover:bg-slate-800 rounded-xl flex items-center justify-between text-left transition-colors"
                    >
                      <span className="text-xs font-bold text-white truncate">{w.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
