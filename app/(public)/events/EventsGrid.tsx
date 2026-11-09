"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Filter,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Star,
  ArrowUpDown,
  Zap,
  Activity,
  X,
} from "lucide-react";

type Event = {
  id: string;
  title: string;
  slug: string;
  date: Date | string;
  promotion: string;
  posterUrl: string | null;
  avgRating?: number;
  reviewCount?: number;
  startTime?: Date | string | null;
  endTime?: Date | string | null;
};

type SortOption = "newest" | "oldest" | "top-rated" | "a-z";

import { CheckCircle2 } from "lucide-react";
import WhereToWatchBadge from "@components/WhereToWatchBadge";

export default function EventsGrid({
  events,
  initialPromotion,
  reviewedEventIds = [],
}: {
  events: Event[];
  initialPromotion?: string;
  reviewedEventIds?: string[];
}) {
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("All");
  const [promotionFilter, setPromotionFilter] = useState(
    initialPromotion ?? "All",
  );
  const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  const uniqueYears = Array.from(
    new Set(events.map((e) => new Date(e.date).getFullYear())),
  ).sort((a, b) => b - a);
  const uniquePromotions = Array.from(
    new Set(events.map((e) => e.promotion)),
  ).sort();

  const filteredEvents = events
    .filter((event) => {
      const normalizedTitle = event.title.toLowerCase();
      const normalizedPromotion = event.promotion.toLowerCase();
      const normalizedSearch = search.toLowerCase();
      const matchesSearch =
        normalizedTitle.includes(normalizedSearch) ||
        normalizedPromotion.includes(normalizedSearch);
      const matchesYear =
        yearFilter === "All" ||
        new Date(event.date).getFullYear().toString() === yearFilter;
      const matchesPromotion =
        promotionFilter === "All" || event.promotion === promotionFilter;
      const matchesUpcoming =
        !showUpcomingOnly || new Date(event.date) > new Date();
      return (
        matchesSearch && matchesYear && matchesPromotion && matchesUpcoming
      );
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === "oldest")
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === "top-rated")
        return (b.avgRating ?? 0) - (a.avgRating ?? 0);
      if (sortBy === "a-z") return a.title.localeCompare(b.title);
      return 0;
    });

  const EVENTS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE,
  );

  return (
    <main className="mx-auto max-w-7xl space-y-7 px-4 pb-20 sm:space-y-10 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-gradient-to-br from-card/80 via-card/40 to-card/10 p-5 shadow-xl shadow-black/20 sm:rounded-3xl sm:p-8 lg:flex-row lg:items-end">
        <div className="space-y-2">
          <span className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
            {events.length.toLocaleString()} shows indexed
          </span>
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">
            Event Archives
          </h1>
          <p className="text-muted-foreground font-medium">
            Browse through the history of professional wrestling.
          </p>
        </div>

        <div className="bg-black/20 border border-white/10 p-2 rounded-xl sm:rounded-2xl flex items-center gap-2 w-full lg:max-w-xl">
          <div className="flex-1 flex items-center gap-4">
            <div className="group relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search events or promotions..."
                className="w-full rounded-xl border border-white bg-white py-3.5 pl-11 pr-11 text-sm font-semibold text-slate-950 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <button 
                onClick={() => {
                    const random = events[Math.floor(Math.random() * events.length)];
                    if (random) window.location.href = `/events/${random.slug}`;
                }}
                aria-label="Open a random event"
                className="group flex h-12 shrink-0 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 text-xs font-bold uppercase tracking-wider text-primary transition-colors hover:bg-primary hover:text-black sm:px-5"
            >
                <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">Random</span>
            </button>
          </div>
        </div>
      </div>

      {/* Year Pills */}
      <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-2 [scrollbar-width:none]">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mr-1">
          Year
        </span>
        {["All", ...uniqueYears.map(String)].map((year) => (
          <button
            key={year}
            onClick={() => {
              setCurrentPage(1);
              setYearFilter(year);
            }}
            className={`shrink-0 self-center px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              yearFilter === year
                ? "bg-primary border-primary text-black shadow-sm shadow-primary/20"
                : "bg-secondary/50 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {year === "All" ? "All Years" : year}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-2 items-center gap-2 rounded-2xl border border-white/10 bg-card/85 p-3 sm:flex sm:flex-wrap sm:gap-3 sm:p-4">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 sm:px-4">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            aria-label="Sort events"
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold outline-none sm:text-sm"
            value={sortBy}
            onChange={(e) => {
              setCurrentPage(1);
              setSortBy(e.target.value as SortOption);
            }}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="top-rated">Top Rated</option>
            <option value="a-z">A – Z</option>
          </select>
        </label>

        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 sm:px-4">
          <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            aria-label="Filter by promotion"
            className="min-w-0 flex-1 cursor-pointer bg-transparent text-xs font-bold outline-none sm:text-sm"
            value={promotionFilter}
            onChange={(e) => {
              setCurrentPage(1);
              setPromotionFilter(e.target.value);
            }}
          >
            <option value="All">All Promotions</option>
            {uniquePromotions.map((promo) => (
              <option key={promo} value={promo}>
                {promo}
              </option>
            ))}
          </select>
        </label>

        <button
          onClick={() => {
            setCurrentPage(1);
            setShowUpcomingOnly(!showUpcomingOnly);
          }}
          aria-pressed={showUpcomingOnly}
          className={`rounded-xl border px-3 py-2 text-xs font-bold transition-colors sm:px-4 sm:text-sm ${showUpcomingOnly ? "bg-primary border-primary text-black" : "bg-secondary/50 border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"}`}
        >
          Upcoming Only
        </button>

        {(yearFilter !== "All" ||
          promotionFilter !== "All" ||
          showUpcomingOnly ||
          search) && (
          <button
            onClick={() => {
              setYearFilter("All");
              setPromotionFilter("All");
              setShowUpcomingOnly(false);
              setSearch("");
              setCurrentPage(1);
            }}
            className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive/30 hover:text-destructive sm:px-4 sm:text-sm"
          >
            Clear Filters
          </button>
        )}

        <div className="hidden flex-1 sm:block"></div>

        <span aria-live="polite" className="col-span-2 pt-1 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground sm:col-auto sm:pt-0 sm:text-left sm:text-xs">
          {filteredEvents.length} {filteredEvents.length === 1 ? "entry" : "entries"} found
        </span>
      </div>

      {paginatedEvents.length > 0 ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-7 md:grid-cols-4 lg:grid-cols-5">
        {paginatedEvents.map((event) => {
          const isReviewed = reviewedEventIds.includes(event.id);
          const hasRating = (event.reviewCount ?? 0) > 0;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group relative -m-1.5 rounded-2xl border border-transparent p-1.5 hover:border-white/10 hover:bg-card/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors duration-200"
            >
              <div className="relative mb-3 aspect-[2/3] overflow-hidden rounded-xl border border-white/10 bg-card shadow-xl transition-[border-color,box-shadow] duration-200 group-hover:border-primary/30 group-hover:shadow-primary/10 sm:rounded-2xl">
                <Image
                  src={event.posterUrl || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Promotion & Watch badge */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                  <span className="px-2 py-1 bg-primary text-black text-[11px] font-bold uppercase rounded shadow-lg w-fit">
                    {event.promotion}
                  </span>
                  <WhereToWatchBadge promotion={event.promotion} title={event.title} size="sm" />
                  {(() => {
                    const now = new Date();
                    // Live only if admin explicitly set startTime (mirrors event page logic)
                    const sTime = event.startTime ? new Date(event.startTime) : new Date(event.date);
                    const eTime = event.endTime
                      ? new Date(event.endTime)
                      : event.startTime
                      ? new Date(sTime.getTime() + 4 * 60 * 60 * 1000)
                      : null;
                    const isLive = !!event.startTime && now >= sTime && (eTime === null || now <= eTime);
                    const isUpcoming = !isLive && now < sTime;

                    if (isLive) {
                      return (
                        <span className="px-2 py-1 bg-red-600 text-white text-[11px] font-bold uppercase rounded shadow-lg flex items-center gap-1 animate-pulse w-fit">
                          <Activity className="w-2.5 h-2.5" /> Live
                        </span>
                      );
                    }
                    if (isUpcoming) {
                      return (
                        <span className="px-2 py-1 bg-green-500 text-white text-[11px] font-bold uppercase rounded shadow-lg w-fit">
                          Upcoming
                        </span>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Reviewed badge */}
                {isReviewed && (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
                      <CheckCircle2 className="w-4 h-4 text-white fill-emerald-500" />
                    </div>
                  </div>
                )}

                {/* Stable fade avoids re-compositing large poster layers on hover. */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                  <div className="space-y-2 bg-black/95 p-4">
                    {hasRating ? (
                      <div className="flex items-center justify-between">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.round(event.avgRating ?? 0) ? "fill-current text-primary" : "text-white/20"}`}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-white">
                          {(event.avgRating ?? 0).toFixed(2)}{" "}
                          <span className="text-white/75 font-medium">
                            ({event.reviewCount})
                          </span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-[11px] font-bold text-white/75 uppercase tracking-wider">
                        No reviews yet
                      </p>
                    )}
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {isReviewed ? "✓ You reviewed this" : "View Event →"}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="line-clamp-2 min-h-8 text-xs font-bold uppercase leading-tight transition-colors group-hover:text-primary sm:text-sm">
                {event.title
                  .replace(/–\s\d{4}(\s–\s\d{2}\s–\s\d{2}|-\d{2}-\d{2})$/, "")
                  .trim()}
              </h2>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-bold uppercase tracking-wider">
                  <Calendar className="w-3 h-3 text-primary" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {hasRating && (
                  <div className="flex items-center gap-1 text-[11px] font-bold text-primary">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {(event.avgRating ?? 0).toFixed(2)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div> : (
        <div className="rounded-2xl border border-dashed border-white/15 bg-card/85 px-6 py-16 text-center">
          <Search className="mx-auto h-8 w-8 text-primary/60" />
          <h2 className="mt-4 text-xl font-black uppercase italic">No events found</h2>
          <p className="mt-2 text-sm text-muted-foreground">Try another search or clear the active filters.</p>
          <button
            onClick={() => {
              setYearFilter("All");
              setPromotionFilter("All");
              setShowUpcomingOnly(false);
              setSearch("");
              setCurrentPage(1);
            }}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-black"
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 sm:gap-6 mt-12 pt-7 border-t border-border rounded-2xl bg-card/85">
          <button
            aria-label="Previous page"
            className="p-2 rounded-full border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo(0, 0);
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold uppercase tracking-wider">
            Page {currentPage} of {totalPages}
          </span>
          <button
            aria-label="Next page"
            className="p-2 rounded-full border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo(0, 0);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
}
