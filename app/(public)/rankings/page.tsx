import { prisma } from "@lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Star, Trophy, TrendingUp, Calendar, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const events = await prisma.event.findMany({
    include: { reviews: { select: { rating: true } } },
  });

  const allRatings = events.flatMap((e) => e.reviews.map((r) => r.rating));
  const globalAvg = allRatings.length
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 3;
  const minReviews = 1;

  const ranked = events
    .map((e) => {
      const rats = e.reviews.map((r) => r.rating);
      const v = rats.length;
      const R = v ? rats.reduce((a, b) => a + b, 0) / v : 0;
      const score =
        (v / (v + minReviews)) * R +
        (minReviews / (v + minReviews)) * globalAvg;
      return { ...e, score: v > 0 ? score : 0, avgRating: R, reviewCount: v };
    })
    .filter((e) => e.reviewCount > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 50);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      {/* Header */}
      <div className="space-y-4">
        <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full">
          <TrendingUp className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Community Voted
          </span>
        </div>
        <h1 className="text-6xl font-black italic uppercase tracking-tighter leading-none">
          Event
          <br />
          Rankings
        </h1>
        <p className="text-muted-foreground font-medium italic max-w-xl">
          The definitive community-driven ranking of the greatest professional
          wrestling events, ordered by Bayesian weighted score.
        </p>
      </div>

      {ranked.length === 0 && (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold italic">
            No rated events yet. Be the first to leave a review!
          </p>
          <Link
            href="/events"
            className="btn-primary inline-block mt-6 text-sm"
          >
            Browse Events
          </Link>
        </div>
      )}

      {/* Top 3 podium */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {top3.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className={`group relative rounded-[2.5rem] overflow-hidden border transition-all hover:scale-[1.02] ${
                i === 0
                  ? "border-yellow-400/40 shadow-2xl shadow-yellow-400/10"
                  : i === 1
                    ? "border-slate-400/30 shadow-xl shadow-slate-400/5"
                    : "border-amber-700/30 shadow-xl shadow-amber-700/5"
              }`}
            >
              <div className="relative aspect-[2/3]">
                <Image
                  src={event.posterUrl || "/placeholder.png"}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                {/* Rank badge */}
                <div
                  className={`absolute top-4 left-4 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl shadow-xl ${
                    i === 0
                      ? "bg-yellow-400 text-black"
                      : i === 1
                        ? "bg-slate-300 text-black"
                        : "bg-amber-700 text-white"
                  }`}
                >
                  #{i + 1}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 space-y-2">
                  <span className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase rounded">
                    {event.promotion}
                  </span>
                  <h2 className="text-xl font-black italic uppercase tracking-tighter leading-tight">
                    {event.title.replace(/–\s\d{4}.*$/, "")}
                  </h2>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-primary">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-lg font-black">
                        {event.avgRating.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold">
                        ({event.reviewCount})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-bold">
                      <Calendar className="w-3 h-3" />
                      {new Date(event.date).getFullYear()}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Ranked list #4 onwards */}
      {rest.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-4 mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
              Full Leaderboard
            </h2>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          {rest.map((event, i) => (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="flex items-center gap-5 bg-card/40 border border-white/5 rounded-2xl p-4 hover:bg-card/70 hover:border-primary/20 transition-all group"
            >
              {/* Rank */}
              <div className="w-10 text-center shrink-0">
                <span className="text-lg font-black text-muted-foreground/40">
                  #{i + 4}
                </span>
              </div>

              {/* Poster */}
              <div className="relative w-12 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                <Image
                  src={event.posterUrl || "/placeholder.png"}
                  alt={event.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-black uppercase rounded">
                    {event.promotion}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold">
                    {new Date(event.date).getFullYear()}
                  </span>
                </div>
                <h3 className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors truncate">
                  {event.title.replace(/–\s\d{4}.*$/, "")}
                </h3>
              </div>

              {/* Score */}
              <div className="flex items-center gap-1.5 text-primary shrink-0">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="font-black text-sm">
                  {event.avgRating.toFixed(2)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold">
                  ({event.reviewCount})
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
