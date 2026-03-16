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
  Activity,
  Send,
  List,
  Users,
} from "lucide-react";
import RandomRingButton from "@components/RandomRingButton";
import { getUserFromServerCookie } from "@lib/server-auth";
import HeroReviewCycler from "@components/HeroReviewCycler";
import FeaturedEventCycler from "@components/FeaturedEventCycler";
import HomePoll from "@components/HomePoll";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUserFromServerCookie();
  const userId = user?.id;

  const eventSelect = {
    id: true,
    title: true,
    slug: true,
    date: true,
    promotion: true,
    venue: true,
    posterUrl: true,
    description: true,
    type: true,
    tmdbId: true,
    profightdbUrl: true,
    startTime: true,
    endTime: true,
    currentMatchOrder: true,
    createdAt: true,
  };

  let results: any[] = [[], 0, 0, [], [], [], [], null];
  try {
    results = await Promise.all([
      prisma.event.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: eventSelect,
      }),
      prisma.event.count(),
      prisma.review.count(),
      prisma.event.findMany({ select: { slug: true } }),
      prisma.event.findMany({
        select: {
          ...eventSelect,
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
          event: { select: { ...eventSelect } },
        },
      }),
      prisma.poll.findFirst({
        where: { isActive: true },
        include: {
          options: {
            orderBy: { order: "asc" },
            include: { _count: { select: { votes: true } } },
          },
          votes: userId ? { where: { userId }, select: { optionId: true } } : false,
        },
      }),
    ]);
  } catch (err) {
    console.error("Home page fetch error:", err);
  }

  const [
    events,
    eventCount,
    reviewCount,
    allEventSlugs,
    allEventsForRank,
    configs,
    topMatches,
    activePoll,
  ] = results;

  const configMap = configs.reduce(
    (acc: Record<string, string>, curr: { key: string; value: string }) => ({
      ...acc,
      [curr.key]: curr.value,
    }),
    {} as Record<string, string>,
  );

  const eventSlugs = allEventSlugs.map((e: any) => e.slug);
  const heroImage = (configMap["HERO_IMAGE"] || "").trim();

  // Bayesian-weighted rankings for Hall of Fame
  const allRatings = allEventsForRank.flatMap((e: any) =>
    e.reviews.map((r: any) => r.rating),
  );
  const globalAvg = allRatings.length
    ? allRatings.reduce((a: any, b: any) => a + b, 0) / allRatings.length
    : 3;
  const minReviews = 1;

  const ranked = allEventsForRank
    .map((e: any) => {
      const rats = e.reviews.map((r: any) => r.rating);
      const v = rats.length;
      const R = v ? rats.reduce((a: any, b: any) => a + b, 0) / v : 0;
      const score =
        v > 0
          ? (v / (v + minReviews)) * R + (minReviews / (v + minReviews)) * globalAvg
          : 0;
      return { ...e, score, avgRating: R, reviewCount: v };
    })
    .filter((e: any) => e.reviewCount > 0)
    .sort((a: any, b: any) => b.score - a.score);

  const hallOfFame = ranked.slice(0, 5);

  // Latest events by date (upcoming first, then most recent past)
  const latestEvents = [...allEventsForRank]
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Recent events within the last 7 days (by event date)
  const recentEvents = allEventsForRank
    .filter((e: any) => new Date(e.date) >= sevenDaysAgo)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Trending = most recently reviewed events (activity in last 7 days)
  const recentReviews = await prisma.review.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { eventId: true },
  });
  const trendingIds = Array.from(
    recentReviews.reduce((acc: Map<string, number>, r: any) => {
      acc.set(r.eventId, (acc.get(r.eventId) || 0) + 1);
      return acc;
    }, new Map<string, number>()),
  )
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]: any) => id);

   const trendingEvents = allEventsForRank.filter((e: any) => trendingIds.includes(e.id));
 
   // Sort by the trending order
   const trendingSorted = trendingIds
     .map((id: any) => trendingEvents.find((e: any) => e.id === id))
     .filter(Boolean) as typeof trendingEvents;

  // Featured events: Recent events if exist, else first in rank
  const featuredEvents = recentEvents.length > 0 ? recentEvents.slice(0, 5) : ranked.slice(0, 1);

  return (
    <div className="-mt-28 space-y-16 md:space-y-32 pb-20 md:pb-32">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden rounded-b-[3rem]">
        <div className="absolute inset-0 z-0 bg-slate-950 rounded-b-[3rem] overflow-hidden">
          {heroImage ? (
            <>
              <Image
                src={heroImage}
                alt="Hero Background"
                fill
                className="object-cover opacity-45 scale-105 contrast-110 saturate-125"
                priority
              />
              {/* Keep the bottom readable, but let the image breathe. */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/25 to-background/95 rounded-b-[3rem]" />
            </>
          ) : (
            <>
              {/* No hero image set: gradient-only hero backdrop */}
              <div className="absolute inset-0 bg-[radial-gradient(1000px_700px_at_20%_10%,rgba(251,191,36,0.18)_0%,transparent_60%),radial-gradient(900px_600px_at_85%_20%,rgba(59,130,246,0.10)_0%,transparent_55%),linear-gradient(to_bottom,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.88)_40%,rgba(0,0,0,0.98)_100%)]" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/10 to-background/95 rounded-b-[3rem]" />
            </>
          )}
          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[160px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 relative z-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-24 items-center w-full">
          <div className="space-y-10 animate-in fade-in slide-in-from-left-12 duration-1000">
            <div className="inline-flex items-center gap-3 px-5 py-2 bg-primary/10 border border-primary/20 rounded-full shadow-lg shadow-primary/5">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                The Ultimate Wrestling Database
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.82] uppercase italic whitespace-pre-line text-white">
              {(configMap["HERO_TITLE"]?.includes("DISCOVER") || !configMap["HERO_TITLE"]
                ? "RATE. REVIEW. \nWRESTLING."
                : configMap["HERO_TITLE"]
              )
                .split("\n")
                .map((line: string, i: number) => {
                  const parts = line.split(/(WRESTLING\.?)/i);
                  return (
                    <span key={i} className="block">
                      {parts.map((p: string, j: number) => (
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
                className="h-12 sm:h-14 px-6 sm:px-10 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-[var(--primary-hover)] hover:shadow-[var(--primary-hover)/40] hover:scale-105 active:scale-95 transition-all"
              >
                Explore Archives <ArrowRight className="w-4 h-4" />
              </Link>

              <RandomRingButton
                eventSlugs={eventSlugs}
                label="Random Event"
                className="h-12 sm:h-14 px-6 sm:px-10 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-[var(--primary-hover)] hover:shadow-[var(--primary-hover)/40] hover:scale-105 active:scale-95 transition-all shrink-0"
              />

              {!user && (
                <Link
                  href="/register"
                  className="h-12 sm:h-14 px-6 sm:px-8 bg-card/60 border border-white/10 text-white text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-2 rounded-2xl hover:bg-card hover:border-primary/20 hover:scale-105 active:scale-95 transition-all"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 md:space-y-40 relative z-10">

        {/* ── Latest Events ── */}
        {latestEvents.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8 md:mb-16 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight">
                    Latest Events
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium italic pl-4">
                  Upcoming and recently added events.
                </p>
              </div>
              <Link
                href="/events"
                className="group flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                All Events <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {latestEvents.map((event: any) => {
                const rating = event.reviews?.length
                  ? event.reviews.reduce((a: any, r: any) => a + r.rating, 0) / event.reviews.length
                  : 0;
                const now = new Date();
                const sTime = event.startTime ? new Date(event.startTime) : new Date(event.date);
                const eTime = event.endTime ? new Date(event.endTime) : event.startTime ? new Date(sTime.getTime() + 4 * 60 * 60 * 1000) : null;
                const isLive = !!event.startTime && now >= sTime && (eTime === null || now <= eTime);
                const isUpcoming = !isLive && now < sTime;
                return (
                  <Link key={event.id} href={`/events/${event.slug}`} className="group relative">
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-4 border border-white/5">
                      <Image
                        src={event.posterUrl || "/placeholder.png"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        <span className="px-2 py-1 bg-primary text-black text-[9px] font-black uppercase rounded shadow-lg w-fit">
                          {event.promotion}
                        </span>
                        {isLive && (
                          <span className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded shadow-lg flex items-center gap-1 animate-pulse w-fit">
                            <Activity className="w-2.5 h-2.5" /> Live
                          </span>
                        )}
                        {isUpcoming && !isLive && (
                          <span className="px-2 py-1 bg-green-500 text-white text-[8px] font-black uppercase rounded shadow-lg w-fit">
                            Upcoming
                          </span>
                        )}
                      </div>
                      {rating > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-primary fill-current" />
                          <span className="text-[10px] font-black text-white">{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-xs uppercase italic group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Community Poll ── */}
        {activePoll && (
          <section>
            <HomePoll
              poll={activePoll}
              totalVotes={activePoll.options.reduce(
                (sum: number, o: any) => sum + o._count.votes,
                0
              )}
              userVoteOptionId={activePoll.votes?.[0]?.optionId ?? null}
              isLoggedIn={!!user}
              endsAt={activePoll.endsAt ? (activePoll.endsAt as Date).toISOString() : null}
            />
          </section>
        )}

        {/* ── Hall of Fame ── */}
        {hallOfFame.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8 md:mb-16 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight">
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
              {hallOfFame.map((event: any, i: number) => (
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

        {/* ── Lists CTA ── */}
        <section>
          <div className="grid sm:grid-cols-2 gap-4">
            {/* Lists */}
            <Link
              href="/lists"
              className="group relative rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/25 bg-card/30 hover:bg-card/60 p-8 flex items-center gap-6 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <List className="w-5 h-5 text-primary" />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary mb-1">Community Lists</p>
                <h3 className="font-black italic uppercase tracking-tight text-base leading-tight group-hover:text-primary transition-colors">
                  Build your own<br />top lists
                </h3>
                <p className="text-xs text-muted-foreground/60 mt-1.5 font-medium">Curate events and matches into shareable ranked collections.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* Watchlist */}
            <Link
              href={user ? "/watchlist" : "/register"}
              className="group relative rounded-[2rem] overflow-hidden border border-white/5 hover:border-primary/25 bg-card/30 hover:bg-card/60 p-8 flex items-center gap-6 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Your Watchlist</p>
                <h3 className="font-black italic uppercase tracking-tight text-base leading-tight group-hover:text-blue-400 transition-colors">
                  Track what you've<br />watched
                </h3>
                <p className="text-xs text-muted-foreground/60 mt-1.5 font-medium">Mark events as watched, attended, or on your list.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
            </Link>
          </div>
        </section>

        {/* ── Trending This Week ── */}
        {trendingSorted.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8 md:mb-16 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-8">
               {trendingSorted.map((event: any) => {
                const rating = event.reviews.length
                  ? event.reviews.reduce((a: any, r: any) => a + r.rating, 0) /
                    event.reviews.length
                  : 0;
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
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        <span className="px-2 py-1 bg-primary text-black text-[9px] font-black uppercase rounded shadow-lg w-fit">
                          {event.promotion}
                        </span>
                        <span className="px-2 py-1 bg-primary/80 text-black text-[8px] font-black uppercase rounded shadow-lg flex items-center gap-1 w-fit">
                          <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                      </div>
                    </div>
                    <h3 className="font-black text-xs uppercase italic group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-primary fill-current" />
                        <span className="text-[10px] font-black text-primary">
                          {rating.toFixed(2)}
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
            <div className="flex justify-between items-end mb-8 md:mb-16 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight">
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 sm:gap-10">
              {recentEvents.map((event: any, i: number) => (
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
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                      <span className="px-2 py-1 bg-primary text-black text-[9px] font-black uppercase rounded shadow-lg w-fit">
                        {event.promotion}
                      </span>
                      {(() => {
                        const now = new Date();
                        const sTime = event.startTime ? new Date(event.startTime) : new Date(event.date);
                        const eTime = event.endTime ? new Date(event.endTime) : event.startTime ? new Date(sTime.getTime() + 4 * 60 * 60 * 1000) : null;
                        const isLive = !!event.startTime && now >= sTime && (eTime === null || now <= eTime);
                        const isUpcoming = !isLive && now < sTime;
                        if (isLive) return (
                          <span className="px-2 py-1 bg-red-600 text-white text-[8px] font-black uppercase rounded shadow-lg flex items-center gap-1 animate-pulse w-fit">
                            <Activity className="w-2.5 h-2.5" /> Live
                          </span>
                        );
                        if (isUpcoming) return (
                          <span className="px-2 py-1 bg-blue-600 text-white text-[8px] font-black uppercase rounded shadow-lg w-fit">
                            Upcoming
                          </span>
                        );
                        return null;
                      })()}
                    </div>
                  </div>
                  <h3 className="font-black text-sm leading-tight uppercase italic group-hover:text-primary transition-colors line-clamp-2">
                    {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                  </h3>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                    {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Top Matches ── */}
        {topMatches.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-8 md:mb-16 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tight">
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
              {topMatches.map((match: any, i: number) => {
                const names = match.participants
                  .map((p: any) => p.wrestler.name)
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


        {/* ── Community CTA ── */}
        <section>
          <div className="relative rounded-[2rem] overflow-hidden border border-white/5 bg-card/20 p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_80%_50%,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary">The Community</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tighter leading-none">
                  See who's leading<br className="hidden sm:block" /> the archive
                </h3>
                <p className="text-sm text-muted-foreground/60 font-medium">
                  Rank up by rating, reviewing, and predicting. Every action counts.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/leaderboard"
                  className="h-11 px-6 bg-primary text-black text-xs font-black uppercase italic tracking-widest flex items-center gap-2 rounded-xl hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <Trophy className="w-3.5 h-3.5" /> Leaderboard
                </Link>
                <Link
                  href="/feed"
                  className="h-11 px-6 bg-card/60 border border-white/10 text-sm font-black uppercase italic tracking-widest flex items-center gap-2 rounded-xl hover:border-primary/30 hover:bg-card transition-all"
                >
                  <Activity className="w-3.5 h-3.5" /> Activity Feed
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Submit Event CTA ── */}
        <section>
          <div className="relative rounded-[2.5rem] overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-card/30 p-10 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-12">
            {/* Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <Send className="w-3.5 h-3.5 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Community</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none">
                Know an event<br />we&apos;re missing?
              </h2>
              <p className="text-muted-foreground font-medium italic max-w-md">
                Help grow the archive. Submit an event with a Cagematch or ProFightDB link and we&apos;ll import the full match card automatically. Approved submissions earn you <span className="text-foreground font-bold">5 rank points</span>.
              </p>
            </div>

            <div className="relative z-10 shrink-0 flex flex-col items-center gap-3">
              <Link
                href="/submit-event"
                className="h-14 px-10 bg-primary text-black text-sm font-black uppercase italic tracking-widest flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all"
              >
                Submit an Event <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Free account required</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
