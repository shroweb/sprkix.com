"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Calendar, ArrowRight } from "lucide-react";
import HeroReviewCycler from "./HeroReviewCycler";

export default function FeaturedEventCycler({ events }: { events: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!events || events.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 8000); // Cycle every 8 seconds
    return () => clearInterval(timer);
  }, [events]);

  if (!events || events.length === 0) return null;

  return (
    <div className="relative h-full w-full">
      {events.map((event, i) => {
        const rating = event.reviews.length
          ? (event.reviews.reduce((a: number, b: any) => a + b.rating, 0) / event.reviews.length)
          : 0;
        const now = new Date();
        const eventDate = new Date(event.date);
        // Use startTime/endTime for precise live window; fall back to same-day heuristic only if no startTime
        let isLive = false;
        if (event.startTime) {
          const sTime = new Date(event.startTime);
          const eTime = event.endTime
            ? new Date(event.endTime)
            : new Date(sTime.getTime() + 4 * 60 * 60 * 1000);
          isLive = now >= sTime && now <= eTime;
        } else {
          // No start time set — show Live only if event date is today AND past 6pm local
          const eventDay = eventDate.toDateString();
          const todayDay = now.toDateString();
          isLive = eventDay === todayDay && now.getHours() >= 18;
        }
        const isUpcoming = !isLive && (event.startTime ? new Date(event.startTime) > now : eventDate > now);

        return (
          <div
            key={event.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            <Link href={`/events/${event.slug}`}>
              <div className="relative aspect-[4/5] bg-card/40 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl hover:scale-[1.02] transition-all duration-700 group isolate">
                <Image
                  src={event.posterUrl || "/placeholder.png"}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                <div className="absolute top-5 left-5 right-5 flex items-center justify-between">
                  {isLive ? (
                    <div className="flex items-center gap-2 bg-red-600 px-3 py-1.5 rounded-xl shadow-lg">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      <span className="text-xs font-black uppercase tracking-widest text-white">
                        Live Now
                      </span>
                    </div>
                  ) : isUpcoming ? (
                    <div className="flex items-center gap-2 bg-green-500 px-3 py-1.5 rounded-xl shadow-lg">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                      <span className="text-xs font-black uppercase tracking-widest text-white">
                        Upcoming Event
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 bg-primary px-3 py-1.5 rounded-xl shadow-lg">
                      <Calendar className="w-3.5 h-3.5 text-black" />
                      <span className="text-xs font-black uppercase tracking-widest text-black">
                        Recent Event
                      </span>
                    </div>
                  )}
                  {!isUpcoming && event.reviews.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-white/10">
                      <Star className="w-3.5 h-3.5 text-primary fill-current" />
                      <span className="text-sm font-black text-white">
                        {rating.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-7 space-y-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary mb-1">
                      {event.promotion}
                    </p>
                    <h3 className="text-xl font-black italic uppercase tracking-tighter leading-tight text-white">
                      {event.title
                        .replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "")
                        .trim()}
                    </h3>
                  </div>
                  {event.reviews.length > 0 && (
                    <HeroReviewCycler reviews={event.reviews} />
                  )}
                  <div className="flex items-center gap-2 pt-1">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      View Event
                    </span>
                    <ArrowRight className="w-3 h-3 text-primary" />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        );
      })}
      
      {/* Progress Dots */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {events.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? "w-8 bg-primary" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
