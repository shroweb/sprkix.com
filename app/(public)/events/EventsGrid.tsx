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
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8 sm:space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">
            Event Archives
          </h1>
          <p className="text-muted-foreground font-medium">
            Browse through the history of professional wrestling.
          </p>
        </div>

        <div className="bg-card border border-border p-2 rounded-2xl flex items-center gap-2">
          <div className="flex-1 flex items-center gap-4">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search events or promotions..."
                className="w-full bg-card/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium text-gray-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <button 
                onClick={() => {
                    const random = events[Math.floor(Math.random() * events.length)];
                    if (random) window.location.href = `/events/${random.slug}`;
                }}
                className="hidden sm:flex items-center gap-2 px-6 py-4 bg-primary/10 text-primary border border-primary/20 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-primary hover:text-black transition-all group"
            >
                <Zap className="w-3 h-3 group-hover:scale-110 transition-transform" />
                Random
            </button>
          </div>
        </div>
      </div>

      {/* Year Pills */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mr-1">
          Year
        </span>
        {["All", ...uniqueYears.map(String)].map((year) => (
          <button
            key={year}
            onClick={() => {
              setCurrentPage(1);
              setYearFilter(year);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all border ${
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
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
          <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            className="bg-transparent text-sm font-bold outline-none cursor-pointer"
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
        </div>

        <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
          <Trophy className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            className="bg-transparent text-sm font-bold outline-none cursor-pointer"
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
        </div>

        <button
          onClick={() => {
            setCurrentPage(1);
            setShowUpcomingOnly(!showUpcomingOnly);
          }}
          className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${showUpcomingOnly ? "bg-primary border-primary text-black" : "bg-secondary/50 border-border text-muted-foreground"}`}
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
            className="px-4 py-2 rounded-xl border border-border text-sm font-bold text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all"
          >
            Clear Filters
          </button>
        )}

        <div className="flex-1"></div>

        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {filteredEvents.length} Entries Found
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-8">
        {paginatedEvents.map((event) => {
          const isReviewed = reviewedEventIds.includes(event.id);
          const hasRating = (event.reviewCount ?? 0) > 0;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group relative"
            >
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-4 border border-white/5">
                <Image
                  src={event.posterUrl || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {/* Base gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                {/* Promotion badge */}
                <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                  <span className="px-2 py-1 bg-primary text-black text-[9px] font-black uppercase rounded shadow-lg w-fit">
                    {event.promotion}
                  </span>
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
                        <span className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded shadow-lg flex items-center gap-1 animate-pulse w-fit">
                          <Activity className="w-2.5 h-2.5" /> Live
                        </span>
                      );
                    }
                    if (isUpcoming) {
                      return (
                        <span className="px-2 py-1 bg-green-500 text-white text-[8px] font-black uppercase rounded shadow-lg w-fit">
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

                {/* Slide-up info panel */}
                <div className="absolute bottom-0 left-0 right-0 z-10 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
                  <div className="bg-black/90 backdrop-blur-sm p-4 space-y-2">
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
                        <span className="text-xs font-black text-white">
                          {(event.avgRating ?? 0).toFixed(2)}{" "}
                          <span className="text-white/40 font-medium">
                            ({event.reviewCount})
                          </span>
                        </span>
                      </div>
                    ) : (
                      <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                        No reviews yet
                      </p>
                    )}
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                      {isReviewed ? "✓ You reviewed this" : "View Event →"}
                    </p>
                  </div>
                </div>
              </div>

              <h2 className="font-bold text-sm leading-tight group-hover:text-primary transition-colors italic uppercase line-clamp-2">
                {event.title
                  .replace(/–\s\d{4}(\s–\s\d{2}\s–\s\d{2}|-\d{2}-\d{2})$/, "")
                  .trim()}
              </h2>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                  <Calendar className="w-3 h-3 text-primary" />
                  {new Date(event.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                {hasRating && (
                  <div className="flex items-center gap-1 text-[10px] font-black text-primary">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    {(event.avgRating ?? 0).toFixed(2)}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-16 pt-8 border-t border-border">
          <button
            className="p-2 rounded-full border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo(0, 0);
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-black italic uppercase tracking-widest">
            Page {currentPage} of {totalPages}
          </span>
          <button
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
