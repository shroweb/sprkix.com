import Link from "next/link";
import { prisma } from "@lib/prisma";
import Image from "next/image";
import {
  ArrowRight,
  Trophy,
  Star,
  Calendar,
  Flame,
  Activity,
  Send,
  List,
  Users,
} from "lucide-react";
import { getUserFromServerCookie } from "@lib/server-auth";
import FeaturedEventCycler from "@components/FeaturedEventCycler";
import HomePoll from "@components/HomePoll";
import TonightHero from "@components/TonightHero";
import ForYou from "@components/ForYou";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getUserFromServerCookie();
  const userId = user?.id;

  let eventCount = 0;
  let wrestlerCount = 0;
  let promotionCount = 0;
  let allEvents: any[] = [];
  let reviewAgg: any[] = [];
  let configs: { key: string; value: string }[] = [];
  let topMatches: any[] = [];
  let activePoll: any = null;
  let trendingAgg: { eventId: string; _count: { _all: number } }[] = [];

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const homeEventSelect = {
      id: true,
      title: true,
      slug: true,
      date: true,
      promotion: true,
      posterUrl: true,
      startTime: true,
      endTime: true,
    };

    const results = await Promise.allSettled([
      prisma.event.count(),
      prisma.wrestler.count(),
      prisma.promotion.count(),
      prisma.event.findMany({ select: homeEventSelect }),
      prisma.review.groupBy({
        by: ["eventId"],
        _avg: { rating: true },
        _count: { _all: true },
      }),
      prisma.siteConfig.findMany(),
      prisma.match.findMany({
        where: { rating: { gt: 0 } },
        orderBy: { rating: "desc" },
        take: 5,
        include: {
          participants: { include: { wrestler: true } },
          event: {
            select: {
              slug: true,
              title: true,
              posterUrl: true,
            },
          },
        },
      }),
      prisma.poll.findFirst({
        where: { isActive: true },
        include: {
          options: {
            orderBy: { order: "asc" },
            include: { _count: { select: { votes: true } } },
          },
        },
      }),
      prisma.review.groupBy({
        by: ["eventId"],
        where: { createdAt: { gte: sevenDaysAgo } },
        _count: { _all: true },
      }),
    ]);

    eventCount = results[0].status === "fulfilled" ? results[0].value : 0;
    wrestlerCount = results[1].status === "fulfilled" ? results[1].value : 0;
    promotionCount = results[2].status === "fulfilled" ? results[2].value : 0;
    allEvents = results[3].status === "fulfilled" ? results[3].value : [];
    reviewAgg = results[4].status === "fulfilled" ? results[4].value : [];
    configs = results[5].status === "fulfilled" ? results[5].value : [];
    topMatches = results[6].status === "fulfilled" ? results[6].value : [];
    activePoll = results[7].status === "fulfilled" ? results[7].value : null;
    trendingAgg = results[8].status === "fulfilled" ? results[8].value : [];

    if (eventCount === 0 && allEvents.length > 0) {
      eventCount = allEvents.length;
    }
  } catch (err) {
    console.error("Home page fetch error:", err);
  }

  let userVoteOptionId: string | null = null;
  if (userId && activePoll?.id) {
    try {
      const vote = await prisma.pollVote.findUnique({
        where: {
          pollId_userId: {
            pollId: activePoll.id,
            userId,
          },
        },
        select: { optionId: true },
      });
      userVoteOptionId = vote?.optionId ?? null;
    } catch (err) {
      console.error("Home poll vote fetch error:", err);
    }
  }

  const configMap = configs.reduce(
    (acc: Record<string, string>, curr: { key: string; value: string }) => ({
      ...acc,
      [curr.key]: curr.value,
    }),
    {} as Record<string, string>,
  );

  const heroImage = (configMap["HERO_IMAGE"] || "").trim();
  const eventSlugs = allEvents.map((event: any) => event.slug);
  const reviewAggMap = new Map(
    reviewAgg.map((row: any) => [
      row.eventId,
      {
        reviewCount: row._count._all,
        avgRating: row._avg.rating ?? 0,
      },
    ]),
  );
  const allEventsForRank = allEvents.map((event: any) => ({
    ...event,
    ...(reviewAggMap.get(event.id) ?? { reviewCount: 0, avgRating: 0 }),
  }));

  // Bayesian-weighted rankings for Hall of Fame
  const totalReviewCount = reviewAgg.reduce(
    (sum: number, row: any) => sum + row._count._all,
    0,
  );
  const globalAvg = totalReviewCount
    ? reviewAgg.reduce(
        (sum: number, row: any) => sum + (row._avg.rating ?? 0) * row._count._all,
        0,
      ) / totalReviewCount
    : 3;
  const minReviews = 1;

  const ranked = allEventsForRank
    .map((e: any) => {
      const v = e.reviewCount ?? 0;
      const R = e.avgRating ?? 0;
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
    .slice(0, 6);

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Recent events within the last 7 days (by event date)
  const recentEvents = allEventsForRank
    .filter((e: any) => new Date(e.date) >= sevenDaysAgo)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Trending = most recently reviewed events (activity in last 7 days)
  const trendingIds = [...trendingAgg]
    .sort((a: any, b: any) => b._count._all - a._count._all)
    .slice(0, 5)
    .map((row: any) => row.eventId);

   const trendingEvents = allEventsForRank.filter((e: any) => trendingIds.includes(e.id));
 
   // Sort by the trending order
   const trendingSorted = trendingIds
     .map((id: any) => trendingEvents.find((e: any) => e.id === id))
     .filter(Boolean) as typeof trendingEvents;

  // Featured events: Recent events if exist, else first in rank
  const featuredEventIds = (recentEvents.length > 0 ? recentEvents.slice(0, 5) : ranked.slice(0, 1)).map(
    (event: any) => event.id,
  );
  let featuredEvents: any[] = [];
  if (featuredEventIds.length > 0) {
    try {
      const featuredEventRows = await prisma.event.findMany({
        where: { id: { in: featuredEventIds } },
        select: {
          id: true,
          title: true,
          slug: true,
          date: true,
          promotion: true,
          posterUrl: true,
          startTime: true,
          endTime: true,
          reviews: {
            select: {
              id: true,
              rating: true,
              comment: true,
              user: { select: { name: true } },
            },
          },
        },
      });
      const featuredEventMap = new Map(
        featuredEventRows.map((event: any) => [event.id, event]),
      );
      featuredEvents = featuredEventIds
        .map((id: string) => featuredEventMap.get(id))
        .filter(Boolean);
    } catch (err) {
      console.error("Featured events fetch error:", err);
    }
  }

  // Promotion cards computed from all events
  const promotionCardMap: Record<string, { name: string; eventCount: number; posters: (string|null)[]; latestDate: Date; avgRating: number|null; reviewCount: number; totalRating: number }> = {};
  for (const e of allEventsForRank) {
    if (!promotionCardMap[e.promotion]) {
      promotionCardMap[e.promotion] = { name: e.promotion, eventCount: 0, posters: [], latestDate: new Date(e.date), avgRating: null, reviewCount: 0, totalRating: 0 };
    }
    const p = promotionCardMap[e.promotion];
    p.eventCount++;
    p.reviewCount += e.reviewCount ?? 0;
    p.totalRating += (e.avgRating ?? 0) * (e.reviewCount ?? 0);
    if (e.posterUrl && p.posters.length < 4) p.posters.push(e.posterUrl);
    if (new Date(e.date) > p.latestDate) p.latestDate = new Date(e.date);
  }
  for (const p of Object.values(promotionCardMap)) {
    p.avgRating = p.reviewCount ? parseFloat((p.totalRating / p.reviewCount).toFixed(2)) : null;
  }
  const promotionCards = Object.values(promotionCardMap)
    .sort((a, b) => b.eventCount - a.eventCount)
    .slice(0, 6);

  return (
    <div className="-mt-28 space-y-14 md:space-y-24 pb-20 md:pb-28 overflow-x-clip">
      {/* ── Full-width cinematic hero ── */}
      <FeaturedEventCycler
        events={featuredEvents}
        eventSlugs={eventSlugs}
        fallbackImage={heroImage}
        stats={{ events: eventCount, wrestlers: wrestlerCount, promotions: promotionCount }}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-16 md:space-y-28 relative z-10">

        {/* ── Quick discovery rail ── */}
        <nav aria-label="Quick links" className="-mt-7 relative z-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 rounded-2xl border border-white/10 bg-background/90 p-2 sm:p-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
            {[
              { href: "/events", label: "Browse events", detail: `${eventCount.toLocaleString()} in the archive`, icon: Calendar },
              { href: "/rankings", label: "View rankings", detail: "Community favourites", icon: Trophy },
              { href: "/wrestlers", label: "Find wrestlers", detail: `${wrestlerCount.toLocaleString()} profiles`, icon: Users },
              { href: "/lists", label: "Explore lists", detail: "Fan-made collections", icon: List },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3.5 hover:border-white/10 hover:bg-white/[0.04] transition-all">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs font-bold uppercase tracking-wide text-white group-hover:text-primary transition-colors">{item.label}</span>
                    <span className="hidden sm:block truncate text-[11px] font-medium text-muted-foreground">{item.detail}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        <TonightHero />
        {userId && <ForYou userId={userId} />}

        {/* ── Latest Events ── */}
        {latestEvents.length > 0 && (
          <section>
            <div className="flex items-end justify-between gap-4 mb-7 md:mb-10 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tight">
                    Latest Events
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium pl-4">
                  Upcoming and recently added events.
                </p>
              </div>
              <Link
                href="/events"
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                All Events <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              {latestEvents.map((event: any) => {
                const rating = event.avgRating ?? 0;
                const now = new Date();
                const sTime = event.startTime ? new Date(event.startTime) : new Date(event.date);
                const eTime = event.endTime ? new Date(event.endTime) : event.startTime ? new Date(sTime.getTime() + 4 * 60 * 60 * 1000) : null;
                const isLive = !!event.startTime && now >= sTime && (eTime === null || now <= eTime);
                const isUpcoming = !isLive && now < sTime;
                return (
                  <Link key={event.id} href={`/events/${event.slug}`} className="group relative w-[54vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <div className="relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/10 bg-card group-hover:border-primary/30 group-hover:-translate-y-1 transition-all duration-300">
                      <Image
                        src={event.posterUrl || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        <span className="px-2 py-1 bg-primary text-black text-[11px] font-bold uppercase rounded shadow-lg w-fit">
                          {event.promotion}
                        </span>
                        {isLive && (
                          <span className="px-2 py-1 bg-red-600 text-white text-[11px] font-bold uppercase rounded shadow-lg flex items-center gap-1 animate-pulse w-fit">
                            <Activity className="w-2.5 h-2.5" /> Live
                          </span>
                        )}
                        {isUpcoming && !isLive && (
                          <span className="px-2 py-1 bg-green-500 text-white text-[11px] font-bold uppercase rounded shadow-lg w-fit">
                            Upcoming
                          </span>
                        )}
                      </div>
                      {rating > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-primary fill-current" />
                          <span className="text-[11px] font-bold text-white">{rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs uppercase group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </h3>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
                      {event.reviewCount ? `${event.reviewCount} community review${event.reviewCount === 1 ? "" : "s"}` : "Be the first to rate"}
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
              userVoteOptionId={userVoteOptionId}
              isLoggedIn={!!user}
              endsAt={activePoll.endsAt ? (activePoll.endsAt as Date).toISOString() : null}
            />
          </section>
        )}

        {/* ── Hall of Fame ── */}
        {hallOfFame.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-7 md:mb-10 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tight">
                    Hall of Fame
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium pl-4">
                  The community&apos;s highest-rated events of all time.
                </p>
              </div>
              <Link
                href="/rankings"
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                Full Rankings{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {hallOfFame.map((event: any, i: number) => (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 sm:gap-5 bg-card/85 border border-white/10 hover:border-primary/30 hover:bg-card/70 rounded-xl sm:rounded-2xl px-4 sm:px-6 py-4 sm:py-5 transition-all"
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
                        : "text-muted-foreground/80"
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
                    <p className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                      {(event as any).promotion}
                    </p>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Star className="w-3.5 h-3.5 text-primary fill-current" />
                    <span className="font-bold text-sm">
                      {event.avgRating.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-bold">
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
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-primary/30 bg-card/85 hover:bg-card/70 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <List className="w-5 h-5 text-primary" />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Community Lists</p>
                <h3 className="font-bold uppercase tracking-tight text-base leading-tight group-hover:text-primary transition-colors">
                  Build your own<br />top lists
                </h3>
                <p className="text-xs text-muted-foreground/80 mt-1.5 font-medium">Curate events and matches into shareable ranked collections.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/80 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
            </Link>

            {/* Watchlist */}
            <Link
              href={user ? "/watchlist" : "/register"}
              className="group relative rounded-2xl overflow-hidden border border-white/10 hover:border-blue-400/30 bg-card/85 hover:bg-card/70 p-5 sm:p-6 flex items-center gap-4 sm:gap-5 transition-all"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <Trophy className="w-5 h-5 text-blue-400" />
              </div>
              <div className="relative z-10 flex-1 min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-400 mb-1">Your Watchlist</p>
                <h3 className="font-bold uppercase tracking-tight text-base leading-tight group-hover:text-blue-400 transition-colors">
                  Track what you've<br />watched
                </h3>
                <p className="text-xs text-muted-foreground/80 mt-1.5 font-medium">Mark events as watched, attended, or on your list.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground/80 group-hover:text-blue-400 group-hover:translate-x-1 transition-all shrink-0" />
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
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tight">
                    Trending
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium pl-4">
                  Most reviewed events in the last 7 days.
                </p>
              </div>
              <Link
                href="/events"
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                All Events{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
               {trendingSorted.map((event: any) => {
                const rating = event.avgRating ?? 0;
                return (
                  <Link
                    key={event.id}
                    href={`/events/${event.slug}`}
                    className="group relative w-[54vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl mb-3 border border-white/10 group-hover:border-primary/30 group-hover:-translate-y-1 transition-all">
                      <Image
                        src={event.posterUrl || "/placeholder.svg"}
                        alt={event.title}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                        <span className="px-2 py-1 bg-primary text-black text-[11px] font-bold uppercase rounded shadow-lg w-fit">
                          {event.promotion}
                        </span>
                        <span className="px-2 py-1 bg-primary/80 text-black text-[11px] font-bold uppercase rounded shadow-lg flex items-center gap-1 w-fit">
                          <Flame className="w-2.5 h-2.5" /> Hot
                        </span>
                      </div>
                    </div>
                    <h3 className="font-bold text-xs uppercase group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {event.title.replace(/– \d{4}(?:[-–]\d{2}){0,2}$/, "").trim()}
                    </h3>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-1">
                      {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                    {rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 text-primary fill-current" />
                        <span className="text-[11px] font-bold text-primary">
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


        {/* ── Explore by Promotion ── */}
        {promotionCards.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-7 md:mb-10 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tight">
                    Explore by Promotion
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium pl-4">
                  Browse events by your favourite promotion.
                </p>
              </div>
              <Link
                href="/promotions"
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                All Promotions{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 overflow-x-auto sm:overflow-visible snap-x snap-mandatory pb-4 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 no-scrollbar">
              {promotionCards.map((promo) => (
                <Link
                  key={promo.name}
                  href={`/events?promotion=${encodeURIComponent(promo.name)}`}
                  className="group w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none bg-card/85 border border-white/10 rounded-2xl p-5 hover:border-primary/30 hover:bg-card/70 transition-all space-y-4"
                >
                  {/* Poster collage */}
                  <div className="flex gap-2 h-28">
                    {promo.posters.slice(0, 4).map((poster, idx) => (
                      <div
                        key={idx}
                        className={`relative rounded-xl overflow-hidden border border-white/5 flex-1 ${idx === 0 ? "flex-[2]" : ""}`}
                      >
                        <Image
                          src={poster || "/placeholder.svg"}
                          alt=""
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    ))}
                    {promo.posters.length === 0 && (
                      <div className="flex-1 rounded-xl bg-secondary/50 flex items-center justify-center">
                        <Trophy className="w-8 h-8 text-muted-foreground/80" />
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold italic uppercase tracking-tighter group-hover:text-primary transition-colors">
                      {promo.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span className="font-bold">{promo.eventCount}</span>
                        <span className="font-medium">events</span>
                      </div>
                      {promo.avgRating !== null && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Star className="w-3.5 h-3.5 text-primary fill-current" />
                          <span className="font-black text-foreground">{promo.avgRating}</span>
                          <span className="text-[11px] font-bold">({promo.reviewCount} reviews)</span>
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      Latest:{" "}
                      {new Date(promo.latestDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </div>
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 group-hover:gap-2 transition-all">
                    View All Events
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Top Matches ── */}
        {topMatches.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-7 md:mb-10 px-0 sm:px-2">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full block" />
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tight">
                    Top Matches
                  </h2>
                </div>
                <p className="text-muted-foreground font-medium pl-4">
                  The community&apos;s highest-rated individual bouts.
                </p>
              </div>
              <Link
                href="/matches/top"
                className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-4 py-2 rounded-full hover:bg-primary/10 transition-colors"
              >
                View All{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {topMatches.map((match: any, i: number) => {
                const names = match.participants
                  .map((p: any) => p.wrestler.name)
                  .join(", ");
                return (
                  <Link
                    key={match.id}
                    href={`/events/${match.event.slug}`}
                    className="group grid grid-cols-[auto_auto_1fr_auto] items-center gap-3 sm:gap-4 bg-card/85 border border-white/10 hover:border-primary/30 hover:bg-card/70 rounded-xl sm:rounded-2xl px-4 sm:px-5 py-4 transition-all"
                  >
                    <span className="text-2xl font-black italic text-muted-foreground/80 w-8 shrink-0">
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
                      <p className="font-bold text-sm uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                        {match.title}
                      </p>
                      <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5 truncate">
                        {names} · {match.event.title.replace(/– \d{4}.*$/, "").trim()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Star className="w-3.5 h-3.5 text-primary fill-current" />
                      <span className="font-bold text-sm">
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
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 bg-card/85 p-6 md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_80%_50%,rgba(59,130,246,0.06)_0%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">The Community</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold italic uppercase tracking-tighter leading-none">
                  See who's leading<br className="hidden sm:block" /> the archive
                </h3>
                <p className="text-sm text-muted-foreground/80 font-medium">
                  Rank up by rating, reviewing, and predicting. Every action counts.
                </p>
                <div className="flex gap-4 pt-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span><strong className="text-primary text-sm">{eventCount}</strong> events</span>
                  <span><strong className="text-primary text-sm">{wrestlerCount}</strong> wrestlers</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3 shrink-0">
                <Link
                  href="/leaderboard"
                  className="h-11 px-6 bg-primary text-black text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
                >
                  <Trophy className="w-3.5 h-3.5" /> Leaderboard
                </Link>
                <Link
                  href="/feed"
                  className="h-11 px-6 bg-card/60 border border-white/10 text-sm font-bold uppercase tracking-wider flex items-center gap-2 rounded-xl hover:border-primary/30 hover:bg-card transition-all"
                >
                  <Activity className="w-3.5 h-3.5" /> Activity Feed
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Submit Event CTA ── */}
        <section>
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/10 via-card/60 to-card/30 p-7 md:p-10 flex flex-col md:flex-row items-center gap-7 md:gap-10">
            {/* Glow */}
            <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex-1 space-y-4 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <Send className="w-3.5 h-3.5 text-primary" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Community</span>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold italic uppercase tracking-tighter leading-none">
                Know an event<br />we&apos;re missing?
              </h2>
              <p className="text-muted-foreground font-medium max-w-md">
                Help grow the archive. Submit an event with a Cagematch or ProFightDB link and we&apos;ll import the full match card automatically. Approved submissions earn you <span className="text-foreground font-bold">5 rank points</span>.
              </p>
            </div>

            <div className="relative z-10 shrink-0 flex flex-col items-center gap-3">
              <Link
                href="/submit-event"
                className="h-14 px-10 bg-primary text-black text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-3 rounded-2xl shadow-2xl shadow-primary/40 hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all"
              >
                Submit an Event <ArrowRight className="w-4 h-4" />
              </Link>
              <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider">Free account required</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}
