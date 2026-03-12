import Link from "next/link";
import { prisma } from "@lib/prisma";
import Image from "next/image";
import {
  ArrowRight,
  TrendingUp,
  Database,
  MessageSquare,
  Trophy,
  Star,
  Award,
  Calendar,
  Zap,
  Flame,
} from "lucide-react";
import RandomRingButton from "@components/RandomRingButton";
import { getUserFromServerCookie } from "@lib/server-auth";
import HeroReviewCycler from "@components/HeroReviewCycler";
import FeaturedEventCycler from "@components/FeaturedEventCycler";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUserFromServerCookie();

  const [
    events,
    eventCount,
    reviewCount,
    allEventSlugs,
    allEventsForRank,
    configs,
    topMatches,
  ] = await Promise.all([
    prisma.event.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.count(),
    prisma.review.count(),
    prisma.event.findMany({ select: { slug: true } }),
    prisma.event.findMany({
      include: {
        reviews: { select: { rating: true, comment: true, user: { select: { name: true } } } },
      },
    }),
    prisma.siteConfig.findMany(),
    prisma.match.findMany({
      where: { rating: { gt: 0 } },
      orderBy: { rating: "desc" },
      take: 5,
      include: {
        participants: { include: { wrestler: true } },
        event: { select: { slug: true, title: true, posterUrl: true } },
      },
    }),
  ]);

  const configMap = configs.reduce(
    (acc: Record<string, string>, curr: { key: string; value: string }) => ({
      ...acc,
      [curr.key]: curr.value,
    }),
    {} as Record<string, string>,
  );

  const eventSlugs = allEventSlugs.map((e: any) => e.slug);

  // Bayesian-weighted rankings for Hall of Fame
  const allRatings = allEventsForRank.flatMap((e) =>
    e.reviews.map((r: any) => r.rating),
  );
  const globalAvg = allRatings.length
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 3;
  const minReviews = 1;

  const ranked = allEventsForRank
    .map((e) => {
      const rats = e.reviews.map((r: any) => r.rating);
      const v = rats.length;
      const R = v ? rats.reduce((a: number, b: number) => a + b, 0) / v : 0;
      const score =
        v > 0
          ? (v / (v + minReviews)) * R + (minReviews / (v + minReviews)) * globalAvg
          : 0;
      return { ...e, score, avgRating: R, reviewCount: v };
    })
    .filter((e) => e.reviewCount > 0)
    .sort((a, b) => b.score - a.score);

  const hallOfFame = ranked.slice(0, 5);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Recent events within the last 7 days (by event date)
  const recentEvents = allEventsForRank
    .filter(e => new Date(e.date) >= sevenDaysAgo)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Trending = most recently reviewed events (activity in last 7 days)
  const recentReviews = await prisma.review.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { eventId: true },
  });
  const trendingIds = Array.from(
    recentReviews.reduce((acc: Map<string, number>, r) => {
      acc.set(r.eventId, (acc.get(r.eventId) || 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const trendingEvents = allEventsForRank.filter(e => trendingIds.includes(e.id));

  // Sort by the trending order
  const trendingSorted = trendingIds
    .map((id) => trendingEvents.find((e) => e.id === id))
    .filter(Boolean) as typeof trendingEvents;

  // Featured events: Recent events if exist, else first in rank
  const featuredEvents = recentEvents.length > 0 ? recentEvents.slice(0, 5) : ranked.slice(0, 1);

  return (
    <div className="-mt-28 space-y-32 pb-32">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden">
        <div className="absolute inset-0 z-0 bg-slate-950">
          <Image
            src={
              configMap["HERO_IMAGE"] ||
              "https://images.unsplash.com/photo-1599058917212-d750089bc07e?q=80&w=2669&auto=format&fit=crop"
            }
            alt="Hero Background"
            fill
            className="object-cover opacity-25 scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/70 to-background" />
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-6 md:px-10 relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-24 items-center w-full">
          <div className="space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-lg shadow-primary/5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                The Ultimate Wrestling Database
              </span>
            </div>

            <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.82] uppercase italic whitespace-pre-line text-white">
              {(configMap["HERO_TITLE"] || "RATE. REVIEW. \nDISCOVER.")
                .split("\n")
                .map((line: string, i: number, arr: string[]) => {
                  if (arr.length > 1 && i === arr.length - 1) {
                    return (
                      <span key={i} className="block text-primary">
                        {line}
                      </span>
                    );
                  }
                  if (arr.length === 1) {
                    const parts = line.split(/(WRESTLING\.?)/i);
                    return (
                      <span key={i} className="block">
                        {parts.map((p, j) => (
                          <span
                            key={j}
                            className={
                              /WRESTLING/i.test(p) ? "text-primary" : "text-white"
                            }
                          >
                            {p}
                          </span>
                        ))}
                      </span>
                    );
                  }
                  return (
                    <span key={i} className="block text-white">
                      {line}
                    </span>
                  );
                })}
            </h1>

            <p className="text-lg text-muted-foreground max-w-lg leading-relaxed font-medium italic">
              {configMap["HERO_DESC"] ||
                "The definitive community archive for professional wrestling. Documenting every legacy, one vote at a time."}
            </p>

            {/* CTA Buttons — uniform height, 2 primary only */}
            <div className="flex flex-wrap gap-4 pt-4 items-center">
              <Link
                href="/events"
                className="h-14 px-10 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
              >
                Explore Archives <ArrowRight className="w-4 h-4" />
              </Link>

              <RandomRingButton
                eventSlugs={eventSlugs}
                label="Random Event"
                className="h-14 px-10 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all shrink-0"
              />

              {!user && (
                <Link
                  href="/register"
                  className="h-14 px-8 bg-card/60 border border-white/10 text-white text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-2 rounded-2xl hover:bg-card hover:border-primary/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Join Free
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" />
                <span className="text-lg font-black tracking-tighter">
                  {eventCount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Events
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                <span className="text-lg font-black tracking-tighter">
                  {reviewCount.toLocaleString()}
                </span>
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
                  Reviews
                </span>
              </div>
            </div>
          </div>
          
          {/* Featured Card Cycler */}
          {featuredEvents.length > 0 && (
            <div className="hidden lg:block relative group animate-in fade-in slide-in-from-right-12 duration-1000 delay-300 h-full">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-[3rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
              <FeaturedEventCycler events={featuredEvents} />
            </div>
          )}
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-8 space-y-40 relative z-10">

        {/* ── Hall of Fame ── */}
        {hallOfFame.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-16 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-5xl font-black italic uppercase tracking-tight">
                    Hall of Fame
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium italic pl-4">
                  The community&apos;s highest-rated events of all time.
                </p>
              </div>
              <Link
                href="/rankings"
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                Full Rankings{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3">
              {hallOfFame.map((event, i) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group flex items-center gap-5 bg-card/30 border border-white/5 hover:border-primary/30 hover:bg-card/60 rounded-2xl px-6 py-5 transition-all"
                >
                  {/* Rank */}
                  <span
                    className={`text-2xl font-black italic w-8 shrink-0 ${
                      i === 0
                        ? "text-yellow-400"
                        : i === 1
                        ? "text-slate-400"
                        : i === 2
                        ? "text-amber-700"
                        : "text-muted-foreground/40"
                    }`}
                  >
                    #{i + 1}
                  </span>

                  {/* Poster thumb */}
                  {event.posterUrl && (
                    <div className="relative w-10 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                      <Image
                        src={event.posterUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {(event as any).promotion}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Star className="w-3.5 h-3.5 text-primary fill-current" />
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
          </section>
        )}

        {/* ── Trending This Week ── */}
        {trendingSorted.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-16 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-5xl font-black italic uppercase tracking-tight">
                    Trending
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium italic pl-4">
                  Most reviewed events in the last 7 days.
                </p>
              </div>
              <Link
                href="/events"
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                All Events{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
              {trendingSorted.map((event) => {
                const avgRating = event.reviews.length
                  ? event.reviews.reduce((a, r) => a + r.rating, 0) /
                    event.reviews.length
                  : null;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative"
                  >
                    <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl mb-4 border border-white/5">
                      <Image
                        src={event.posterUrl || "/placeholder.png"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      {/* Trending badge */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-primary px-2.5 py-1 rounded-lg shadow-lg">
                        <Flame className="w-3 h-3 text-black" />
                        <span className="text-[10px] font-black uppercase text-black tracking-widest">
                          Hot
                        </span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <span className="px-2 py-0.5 bg-primary text-black text-[10px] font-black uppercase rounded shadow-lg">
                          {event.promotion}
                        </span>
                      </div>
                    </div>
                    <h3 className="font-black text-xs uppercase italic group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </h3>
                    {avgRating !== null && (
                      <div className="flex items-center gap-1 mt-2">
                        <Star className="w-3 h-3 text-primary fill-current" />
                        <span className="text-[10px] font-black text-primary">
                          {avgRating.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Recent Archive ── */}
        {events.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-16 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-5xl font-black italic uppercase tracking-tight">
                    Recent Archive
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium italic pl-4">
                  Newly cataloged historical events.
                </p>
              </div>
              <Link
                href="/events"
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                Full Database{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-10">
              {events.map((event: any) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group relative"
                >
                  <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl mb-6 border border-white/5">
                    <Image
                      src={event.posterUrl || "/placeholder.png"}
                      alt={event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <span className="px-2 py-1 bg-primary text-black text-[10px] font-black uppercase rounded shadow-lg">
                        {event.promotion}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-black text-sm leading-tight uppercase italic group-hover:text-primary transition-colors line-clamp-2">
                    {event.title
                      .replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "")
                      .trim()}
                  </h3>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                      <Calendar className="w-3 h-3 text-primary" />
                      {new Date(event.date).getFullYear()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Top Matches ── */}
        {topMatches.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-16 px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-5xl font-black italic uppercase tracking-tight">
                    Top Matches
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium italic pl-4">
                  The community&apos;s highest-rated individual bouts.
                </p>
              </div>
              <Link
                href="/matches/top"
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                View All{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="space-y-3">
              {topMatches.map((match, i) => {
                const names = match.participants
                  .map((p) => p.wrestler.name)
                  .join(", ");
                return (
                  <Link
                    key={match.id}
                    href={`/events/${match.event.slug}`}
                    className="group flex items-center gap-5 bg-card/30 border border-white/5 hover:border-primary/30 hover:bg-card/60 rounded-2xl px-6 py-5 transition-all"
                  >
                    <span className="text-2xl font-black italic text-muted-foreground/40 w-8 shrink-0">
                      #{i + 1}
                    </span>
                    {match.event.posterUrl && (
                      <div className="relative w-10 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                        <Image
                          src={match.event.posterUrl}
                          alt=""
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                        {match.title}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                        {names} · {match.event.title.replace(/– \d{4}.*$/, "").trim()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Star className="w-3.5 h-3.5 text-primary fill-current" />
                      <span className="font-black text-sm">
                        {(match.rating ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}
