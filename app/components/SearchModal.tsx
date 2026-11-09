"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Search, X, Calendar, UserCircle, Loader2, TrendingUp, Trophy, Building2, Clock, CornerDownLeft } from "lucide-react";

type Row = {
  key: string;
  group: string;
  href: string;
  title: string;
  sub?: string;
  img?: string | null;
  kind: "event" | "wrestler" | "user" | "promotion" | "title";
};

type Api = {
  events?: { id: string; title: string; slug: string; posterUrl: string | null; promotion: string; date: string }[];
  wrestlers?: { id: string; name: string; slug: string; imageUrl: string | null }[];
  users?: { id: string; name: string | null; slug: string; avatarUrl: string | null }[];
  promotions?: { id: string; shortName: string; fullName: string | null; logoUrl: string | null; slug: string }[];
  titles?: { id: string; title: string; promotion: string; photoUrl: string | null; holder: string; href: string }[];
};

const RECENT_KEY = "pr_recent_searches";
const PROMOS = ["WWE", "AEW", "TNA", "NJPW", "ROH"];

function toRows(d: Api): Row[] {
  const rows: Row[] = [];
  d.promotions?.forEach((p) =>
    rows.push({ key: `p${p.id}`, group: "Promotions", kind: "promotion", href: `/promotions/${p.slug}`, title: p.shortName, sub: p.fullName ?? undefined, img: p.logoUrl }),
  );
  d.titles?.forEach((t) =>
    rows.push({ key: `t${t.id}`, group: "Titles", kind: "title", href: t.href, title: t.title, sub: t.holder ? `${t.promotion} · ${t.holder}` : t.promotion, img: t.photoUrl }),
  );
  d.wrestlers?.forEach((w) =>
    rows.push({ key: `w${w.id}`, group: "Wrestlers", kind: "wrestler", href: `/wrestlers/${w.slug}`, title: w.name, img: w.imageUrl }),
  );
  d.events?.forEach((e) =>
    rows.push({ key: `e${e.id}`, group: "Events", kind: "event", href: `/events/${e.slug}`, title: e.title, sub: `${e.promotion} · ${new Date(e.date).getFullYear()}`, img: e.posterUrl }),
  );
  d.users?.forEach((u) =>
    rows.push({ key: `u${u.id}`, group: "Members", kind: "user", href: `/users/${u.slug || u.id}`, title: u.name ?? "Member", sub: "Community member", img: u.avatarUrl }),
  );
  return rows;
}

function Thumb({ row }: { row: Row }) {
  const round = row.kind === "wrestler" || row.kind === "user";
  const size = row.kind === "event" ? "w-10 h-14" : "w-10 h-10";
  const Icon = row.kind === "event" ? Calendar : row.kind === "title" ? Trophy : row.kind === "promotion" ? Building2 : UserCircle;
  return (
    <div className={`relative shrink-0 overflow-hidden border border-white/5 bg-secondary ${size} ${round ? "rounded-full" : ""}`}>
      {row.img ? (
        <Image
          src={row.img}
          alt=""
          fill
          sizes="40px"
          className={row.kind === "title" || row.kind === "promotion" ? "object-contain p-1" : "object-cover"}
        />
      ) : (
        <div className="absolute inset-0 grid place-items-center">
          <Icon className="w-4 h-4 text-muted-foreground/80" />
        </div>
      )}
    </div>
  );
}

export default function SearchModal({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [data, setData] = useState<Api>({});
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<Row | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const rows = useMemo(() => toRows(data), [data]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setData({});
      setActive(0);
      return;
    }
    try {
      setRecent(JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"));
    } catch {
      setRecent([]);
    }
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    if (!trending) {
      fetch("/api/search?q=wrestlemania")
        .then((r) => r.json())
        .then((d: Api) => {
          const e = d.events?.[0];
          if (e) setTrending({ key: "trend", group: "Trending", kind: "event", href: `/events/${e.slug}`, title: e.title, sub: e.promotion, img: e.posterUrl });
        })
        .catch(() => {});
    }
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setData({});
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, { signal: ctrl.signal });
        setData(await res.json());
        setActive(0);
      } catch {
        /* aborted / offline */
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const remember = (q: string) => {
    const term = q.trim();
    if (term.length < 2) return;
    try {
      const next = [term, ...recent.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable */
    }
  };

  const go = (row: Row) => {
    remember(query);
    setOpen(false);
    router.push(row.href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!rows.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % rows.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + rows.length) % rows.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(rows[active]);
    }
  };

  const isEmpty = query.trim().length >= 2 && !loading && rows.length === 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Open search dialog"
        className={className ?? "hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 border border-border px-4 py-2 hover:bg-secondary transition-colors"}
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="font-medium hidden md:inline">Search...</span>
        <kbd className="hidden md:inline ml-2 text-[11px] font-bold bg-background border border-border px-1.5 py-0.5 text-muted-foreground">⌘K</kbd>
      </button>
    );
  }

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[12vh] px-4" onClick={() => setOpen(false)}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />
      <div
        role="dialog"
        aria-label="Search"
        className="relative w-full max-w-2xl bg-card border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-4 p-5 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search wrestlers, events, titles, promotions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />}
          <button onClick={() => setOpen(false)} aria-label="Close search" className="p-1.5 hover:bg-secondary transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {rows.length > 0 && (
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-3">
            {rows.map((row, i) => {
              const header = row.group !== lastGroup ? row.group : null;
              lastGroup = row.group;
              return (
                <div key={row.key}>
                  {header && (
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-3 pt-3 pb-1.5">{header}</p>
                  )}
                  <button
                    data-idx={i}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(row)}
                    className={`group flex w-full items-center gap-4 px-3 py-2.5 text-left transition-colors ${i === active ? "bg-secondary" : ""}`}
                  >
                    <Thumb row={row} />
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm font-black uppercase italic tracking-tight ${i === active ? "text-primary" : ""}`}>{row.title}</p>
                      {row.sub && <p className="mt-0.5 truncate text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{row.sub}</p>}
                    </div>
                    {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {isEmpty && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground font-bold text-sm">No results for “{query}”</p>
          </div>
        )}

        {!query && (
          <div className="p-5 space-y-5">
            {recent.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  <Clock className="w-3 h-3" /> Recent
                </p>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button key={r} onClick={() => setQuery(r)} className="border border-border bg-secondary px-3 py-1.5 text-xs font-bold hover:border-primary hover:text-primary transition-colors">
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">Browse by Promotion</p>
              <div className="flex flex-wrap gap-2">
                {PROMOS.map((promo) => (
                  <button
                    key={promo}
                    onClick={() => setQuery(promo)}
                    className="px-3 py-1.5 bg-secondary border border-border text-xs font-bold uppercase tracking-wider hover:bg-primary hover:text-black hover:border-primary transition-all"
                  >
                    {promo}
                  </button>
                ))}
              </div>
            </div>
            {trending && (
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Trending
                </p>
                <button onClick={() => go(trending)} className="group flex w-full items-center gap-4 px-3 py-2.5 text-left hover:bg-secondary transition-colors">
                  <Thumb row={trending} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black uppercase italic tracking-tight group-hover:text-primary">{trending.title}</p>
                    <p className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{trending.sub}</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground font-bold uppercase tracking-widest">
          <span>↑↓ Navigate</span>
          <span>↵ Open</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
