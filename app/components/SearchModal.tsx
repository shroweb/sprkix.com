"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Calendar, UserCircle, Loader2, TrendingUp } from "lucide-react";

type SearchResult = {
  events: {
    id: string;
    title: string;
    slug: string;
    posterUrl: string | null;
    promotion: string;
    date: string;
  }[];
  wrestlers: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  }[];
  users: {
    id: string;
    name: string | null;
    slug: string;
    avatarUrl: string | null;
  }[];
};

export default function SearchModal() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult>({
    events: [],
    wrestlers: [],
    users: [],
  });
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<{ title: string; slug: string; posterUrl: string | null; promotion: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input + fetch trending when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      if (!trending) {
        fetch("/api/search?q=wrestlemania")
          .then((r) => r.json())
          .then((d) => d.events?.[0] && setTrending(d.events[0]))
          .catch(() => {});
      }
    } else {
      setQuery("");
      setResults({ events: [], wrestlers: [], users: [] });
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ events: [], wrestlers: [], users: [] });
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const hasResults =
    results.events.length > 0 ||
    results.wrestlers.length > 0 ||
    results.users.length > 0;
  const isEmpty = query.length >= 2 && !loading && !hasResults;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 border border-border px-4 py-2 rounded-xl hover:bg-secondary transition-colors"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="font-medium">Search...</span>
        <kbd className="ml-2 text-[10px] font-black bg-background border border-border rounded px-1.5 py-0.5 text-muted-foreground">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      onClick={() => setOpen(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" />

      {/* Modal */}
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-4 p-5 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search events, wrestlers..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-base font-medium outline-none placeholder:text-muted-foreground"
          />
          {loading && (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground shrink-0" />
          )}
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        {hasResults && (
          <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
            {results.events.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                  Events
                </p>
                <div className="space-y-1">
                  {results.events.map((event) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                    >
                      <div className="w-10 h-14 relative rounded-lg overflow-hidden shrink-0 border border-white/5 bg-secondary">
                        {event.posterUrl ? (
                          <Image
                            src={event.posterUrl}
                            alt={event.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors truncate">
                          {event.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                          {event.promotion} ·{" "}
                          {new Date(event.date).getFullYear()}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.wrestlers.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                  Wrestlers
                </p>
                <div className="space-y-1">
                  {results.wrestlers.map((wrestler) => (
                    <Link
                      key={wrestler.id}
                      href={`/wrestlers/${wrestler.slug}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                    >
                      <div className="w-10 h-10 relative rounded-full overflow-hidden shrink-0 border border-white/5 bg-secondary">
                        {wrestler.imageUrl ? (
                          <Image
                            src={wrestler.imageUrl}
                            alt={wrestler.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors">
                        {wrestler.name}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {results.users.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-3 py-2">
                  Users
                </p>
                <div className="space-y-1">
                  {results.users.map((user) => (
                    <Link
                      key={user.id}
                      href={`/users/${user.id}`}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                    >
                      <div className="w-10 h-10 relative rounded-full overflow-hidden shrink-0 border border-white/5 bg-secondary">
                        {user.avatarUrl ? (
                          <Image
                            src={user.avatarUrl}
                            alt={user.name ?? "User"}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center bg-primary text-black font-black text-sm">
                            {user.name
                              ? user.name.charAt(0).toUpperCase()
                              : "U"}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors">
                          {user.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                          Community Member
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {isEmpty && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground font-bold italic text-sm">
              No results for "{query}"
            </p>
          </div>
        )}

        {!query && (
          <div className="p-5 space-y-5">
            {/* Promotion chips */}
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2">Browse by Promotion</p>
              <div className="flex flex-wrap gap-2">
                {["WWE", "AEW", "TNA", "NJPW", "ROH"].map((promo) => (
                  <button
                    key={promo}
                    onClick={() => setQuery(promo)}
                    className="px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs font-black uppercase tracking-wider hover:bg-primary hover:text-black hover:border-primary transition-all"
                  >
                    {promo}
                  </button>
                ))}
              </div>
            </div>

            {/* Trending event */}
            {trending && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-1 mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" /> Trending
                </p>
                <Link
                  href={`/events/${trending.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-4 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors group"
                >
                  <div className="w-10 h-14 relative rounded-lg overflow-hidden shrink-0 border border-white/5 bg-secondary">
                    {trending.posterUrl ? (
                      <Image src={trending.posterUrl} alt={trending.title} fill className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Calendar className="w-4 h-4 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors truncate">{trending.title}</p>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">{trending.promotion}</p>
                  </div>
                </Link>
              </div>
            )}
          </div>
        )}

        <div className="px-5 py-3 border-t border-border flex items-center gap-4 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
          <span>↵ Open</span>
          <span>Esc Close</span>
          <span>⌘K Toggle</span>
        </div>
      </div>
    </div>
  );
}
