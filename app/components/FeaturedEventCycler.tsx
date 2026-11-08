"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, Database, Star, Trophy, Users } from "lucide-react";
import RandomRingButton from "./RandomRingButton";
import WhereToWatchBadge from "./WhereToWatchBadge";

type FeaturedEvent = {
  id: string; title: string; slug: string; date: string | Date; promotion: string;
  posterUrl?: string | null; startTime?: string | Date | null; endTime?: string | Date | null;
  reviews: Array<{ rating: number }>;
};

type Props = {
  events: FeaturedEvent[];
  eventSlugs: string[];
  fallbackImage?: string;
  stats: { events: number; wrestlers: number; promotions: number };
};

function getEventState(event: FeaturedEvent) {
  const now = new Date();
  const eventDate = new Date(event.date);
  let live = false;
  if (event.startTime) {
    const start = new Date(event.startTime);
    const end = event.endTime ? new Date(event.endTime) : new Date(start.getTime() + 4 * 60 * 60 * 1000);
    live = now >= start && now <= end;
  }
  const upcoming = !live && (event.startTime ? new Date(event.startTime) > now : eventDate > now);
  return live ? "live" : upcoming ? "upcoming" : "recent";
}

export default function FeaturedEventCycler({ events, eventSlugs, fallbackImage, stats }: Props) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const isFallback = events.length === 0;
  const displayEvents: FeaturedEvent[] = isFallback ? [{
    id: "archive-hero",
    title: "Rate. Review. Wrestling.",
    slug: "",
    date: new Date(),
    promotion: "The wrestling archive, rated by fans",
    posterUrl: fallbackImage,
    reviews: [],
  }] : events;

  useEffect(() => {
    if (displayEvents.length <= 1 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % displayEvents.length), 9000);
    return () => window.clearInterval(timer);
  }, [displayEvents.length, paused]);

  const event = displayEvents[index];
  const rating = useMemo(() => {
    if (!event?.reviews.length) return null;
    return event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length;
  }, [event]);

  if (!event) return null;

  const state = getEventState(event);
  const date = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(new Date(event.date));
  const title = event.title.replace(/[-–]\s*\d{4}(?:[-–]\d{2}){0,2}$/, "").trim();
  const show = (nextIndex: number) => setIndex((nextIndex + displayEvents.length) % displayEvents.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured wrestling events"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      className="relative isolate min-h-[760px] overflow-hidden border-b border-white/10 bg-slate-950 sm:min-h-[800px] lg:min-h-[86vh]"
    >
      {displayEvents.map((item, itemIndex) => (
        <div key={item.id} aria-hidden={itemIndex !== index} className={`absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none ${itemIndex === index ? "opacity-100" : "opacity-0"}`}>
          {(item.posterUrl || fallbackImage) ? <Image src={item.posterUrl || fallbackImage!} alt="" fill priority={itemIndex === 0} sizes="100vw" className="scale-[1.03] object-cover object-[68%_24%] sm:object-[65%_22%] lg:object-[72%_25%]" /> : <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_25%,rgba(251,191,36,0.24),transparent_28%),radial-gradient(circle_at_25%_60%,rgba(59,130,246,0.15),transparent_32%),linear-gradient(135deg,#020617,#111827_55%,#020617)]" />}
        </div>
      ))}
      {/* Dark overlay layers for crystal-clear text legibility on all screen sizes */}
      <div className="absolute inset-0 bg-slate-950/55 sm:bg-slate-950/45" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.75)_50%,rgba(2,6,23,0.98)_100%)] lg:bg-[linear-gradient(90deg,rgba(2,6,23,0.98)_0%,rgba(2,6,23,0.88)_42%,rgba(2,6,23,0.45)_72%,rgba(2,6,23,0.2)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,transparent_0%,rgba(2,6,23,0.25)_42%,rgba(2,6,23,0.85)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-[760px] max-w-7xl flex-col justify-end px-4 pb-7 pt-32 sm:min-h-[800px] sm:px-8 sm:pb-8 lg:min-h-[86vh] lg:justify-center lg:px-10 lg:pb-44 lg:pt-40">
        <div key={event.id} className="max-w-3xl rounded-3xl border border-white/10 bg-slate-950/70 p-5 backdrop-blur-md sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none animate-in fade-in slide-in-from-left-5 duration-700">
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] ${state === "live" ? "bg-red-600 text-white" : state === "upcoming" ? "bg-emerald-500 text-slate-950" : "bg-primary text-slate-950"}`}>
              {state === "live" && <span className="h-2 w-2 animate-pulse rounded-full bg-white" />}
              {isFallback ? "Community rated" : state === "live" ? "Live now" : state === "upcoming" ? "Coming up" : "Recently added"}
            </span>
            <span className="rounded-full border border-white/15 bg-black/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-white backdrop-blur-md">{isFallback ? "Discover the archive" : "Featured event"}</span>
            <WhereToWatchBadge promotion={event.promotion} title={event.title} variant="hero" />
          </div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-primary sm:text-sm drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">{event.promotion}</p>
          <h1 className="max-w-3xl text-[2.75rem] font-black uppercase italic leading-[0.9] tracking-[-0.055em] text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.95)] sm:text-6xl md:text-7xl lg:text-[5.2rem]">{title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-bold text-slate-100 sm:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
            {!isFallback && <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> {date}</span>}
            {rating !== null ? (
              <span className="inline-flex items-center gap-2"><Star className="h-4 w-4 fill-primary text-primary" /><strong className="text-white">{rating.toFixed(2)}</strong><span className="text-slate-300">from {event.reviews.length} {event.reviews.length === 1 ? "review" : "reviews"}</span></span>
            ) : <span className="max-w-xl text-slate-200 font-bold">{isFallback ? "Discover events, rate every show, and see what wrestling fans recommend next." : "Be the first to rate it"}</span>}
          </div>
          <div className="mt-6 grid gap-3 sm:flex sm:flex-wrap">
            <Link href={isFallback ? "/events" : `/events/${event.slug}`} className="inline-flex h-14 items-center justify-center gap-3 rounded-xl bg-primary px-7 text-sm font-black uppercase italic tracking-wider text-black shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-[var(--primary-hover)]">{isFallback ? "Explore events" : "View event"} <ArrowRight className="h-4 w-4" /></Link>
            {!isFallback && <Link href="/events" className="inline-flex h-14 items-center justify-center rounded-xl border border-white/20 bg-black/40 px-7 text-sm font-black uppercase italic tracking-wider text-white backdrop-blur-md transition-colors hover:border-primary/50 hover:bg-white/10">Explore archive</Link>}
            {eventSlugs.length > 0 && <RandomRingButton eventSlugs={eventSlugs} label="Surprise me" className="group inline-flex h-14 items-center justify-center gap-2.5 rounded-xl border border-white/20 bg-black/40 px-6 text-sm font-black uppercase italic tracking-wider text-slate-200 backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400/60 hover:bg-amber-400/10 hover:text-amber-300 hover:shadow-lg hover:shadow-amber-400/20 active:translate-y-0 disabled:opacity-50" />}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-4 text-[10px] font-black uppercase tracking-widest text-slate-300 sm:text-xs">
            <span className="inline-flex items-center gap-2"><Database className="h-3.5 w-3.5 text-primary" />{stats.events.toLocaleString()} events</span>
            <span className="inline-flex items-center gap-2"><Users className="h-3.5 w-3.5 text-primary" />{stats.wrestlers.toLocaleString()} wrestlers</span>
            <span className="inline-flex items-center gap-2"><Trophy className="h-3.5 w-3.5 text-primary" />{stats.promotions.toLocaleString()} promotions</span>
          </div>
        </div>
      </div>

      {displayEvents.length > 1 && (
        <div className="relative z-20 mx-auto -mt-1 max-w-7xl px-5 pb-9 sm:px-8 lg:absolute lg:inset-x-0 lg:bottom-0 lg:px-10 lg:pb-8">
          <div className="mb-3 flex items-end justify-between">
            <div><p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">On the card</p><p className="text-xs font-bold text-slate-400">Choose another featured show</p></div>
            <div className="flex gap-2">
              <button onClick={() => show(index - 1)} aria-label="Previous featured event" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur hover:border-primary/60 hover:text-primary"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => show(index + 1)} aria-label="Next featured event" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur hover:border-primary/60 hover:text-primary"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
          <div className="scrollbar-none flex snap-x gap-2.5 overflow-x-auto pb-1">
            {displayEvents.map((item, itemIndex) => (
              <button key={item.id} onClick={() => show(itemIndex)} aria-label={`Show ${item.title}`} aria-current={itemIndex === index} className={`group relative flex min-w-[190px] max-w-[240px] flex-1 snap-start items-center gap-3 overflow-hidden rounded-xl border p-2 text-left backdrop-blur-md transition-all ${itemIndex === index ? "border-primary bg-primary/10" : "border-white/10 bg-black/35 hover:border-white/30 hover:bg-white/[0.07]"}`}>
                <span className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-white/5"><Image src={item.posterUrl || fallbackImage || "/placeholder.svg"} alt="" fill sizes="44px" className="object-cover" /></span>
                <span className="min-w-0"><span className="block truncate text-[9px] font-black uppercase tracking-widest text-primary">{item.promotion}</span><span className="mt-1 line-clamp-2 text-xs font-black uppercase italic leading-tight text-white">{item.title}</span></span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
