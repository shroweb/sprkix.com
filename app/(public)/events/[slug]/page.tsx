import Link from "next/link";
import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { cache } from "react";
import { getPosterColors } from "@lib/poster-color";
import ReviewForm from "@components/ReviewForm";
import ReplyForm from "@components/ReplyForm";
import { getUserFromServerCookie } from "@lib/server-auth";
import MatchList from "@components/MatchList";
import ShareButton from "@components/ShareButton";
import ShareReviewButton from "@components/ShareReviewButton";
import ReviewUpvote from "@components/ReviewUpvote";
import AttendButton from "@components/AttendButton";
import SetThemeButton from "@components/SetThemeButton";
import { Calendar, Clock, Star, ChevronLeft, Info, Trophy, MapPin, CheckCircle, Activity } from "lucide-react";
import PredictionCard from "@components/PredictionCard";
import LiveChatContainer from "@components/LiveChatContainer";
import Countdown from "@components/Countdown";
import EventTabs, { type EventTab } from "@components/EventTabs";
import WatchlistIcon from "@components/WatchlistIcon";
import WatchedIcon from "@components/WatchedIcon";
import VisualRating from "@components/VisualRating";
import type { Metadata } from "next";

// Cached per-request: avoids running the full-table rating scan more than once
// (generateMetadata and the page component both run in the same request)
const getGlobalRankingData = cache(async () => {
  const events = await prisma.event.findMany({
    select: { id: true, promotion: true, title: true, slug: true, posterUrl: true, date: true, reviews: { select: { rating: true } } },
  });
  const allRatings = events.flatMap((e) => e.reviews.map((r) => r.rating));
  const globalAverage = allRatings.length
    ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
    : 0;
  const minReviews = 10;
  const ranked = events
    .map((e) => {
      const rats = e.reviews.map((r) => r.rating);
      const R = rats.length ? rats.reduce((a, b) => a + b, 0) / rats.length : 0;
      const v = rats.length;
      const weighted = (v / (v + minReviews)) * R + (minReviews / (v + minReviews)) * globalAverage;
      return { id: e.id, promotion: e.promotion, title: e.title, slug: e.slug, posterUrl: e.posterUrl, date: e.date, weighted, avgRating: R, reviewCount: v };
    })
    .sort((a, b) => b.weighted - a.weighted);
  return { ranked, globalAverage, minReviews, allEvents: events };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    select: { title: true, description: true, posterUrl: true, promotion: true, date: true },
  });

  if (!event) return {};

  const cleanTitle = event.title.replace(/–\s\d{4}.*$/, "").trim();
  const year = new Date(event.date).getFullYear();
  const desc = event.description
    ? event.description.slice(0, 155)
    : `Ratings, reviews and match results for ${cleanTitle} (${year}) by ${event.promotion}.`;

  return {
    title: `${cleanTitle} (${year}) – ${event.promotion} | Sprkix`,
    description: desc,
    openGraph: {
      title: `${cleanTitle} – ${event.promotion}`,
      description: desc,
      images: event.posterUrl ? [{ url: event.posterUrl }] : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanTitle} – ${event.promotion}`,
      description: desc,
      images: event.posterUrl ? [event.posterUrl] : [],
    },
  };
}

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await params;
  const { reviewId } = await searchParams;
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

  let event: any = null;
  try {
    event = await prisma.event.findUnique({
      where: { slug: slug },
      select: {
        ...eventSelect,
        matches: {
          include: {
            participants: {
              include: { wrestler: true },
            },
            ratings: {
              select: {
                rating: true,
                userId: true,
              },
            },
            favoritedBy: {
              select: {
                userId: true,
              },
            },
            predictions: {
              where: { userId: userId || "" },
              select: { predictedWinnerId: true, isCorrect: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        reviews: {
          include: {
            user: true,
            Reply: {
              include: { user: true },
              orderBy: { createdAt: "asc" },
            },
            votes: { select: { userId: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (err) {
    console.error("Event page fetch error:", err);
  }

  if (!event) return notFound();

  const processedMatches = event.matches.map((match: any) => {
    const userRating =
      match.ratings.find((r: any) => r.userId === userId)?.rating || 0;
    const averageRating = match.ratings.length
      ? match.ratings.reduce((sum: number, r: any) => sum + r.rating, 0) /
        match.ratings.length
      : 0;

    // Check if favorited by user
    const isFavorited = user
      ? (match as any).favoritedBy?.some((f: any) => f.userId === userId) || false
      : false;

    const userPrediction = (match as any).predictions?.[0]?.predictedWinnerId || null;
    // Use stored isCorrect when available; fall back to computing from isWinner
    // (covers cases where match result was set without going through the resolution endpoint)
    const dbIsCorrect: boolean | null =
      (match as any).predictions?.[0]?.isCorrect ?? null;
    let userPredictionIsCorrect: boolean | null = dbIsCorrect;
    if (dbIsCorrect === null && userPrediction) {
      const winnerIds = new Set(
        (match as any).participants
          .filter((p: any) => p.isWinner)
          .map((p: any) => p.wrestler.id),
      );
      if (winnerIds.size > 0) {
        userPredictionIsCorrect = winnerIds.has(userPrediction);
      }
    }

    return { ...match, userRating, averageRating, isFavorited, userPrediction, userPredictionIsCorrect };
  });

  // Fetch Community Prediction Stats
  const matchIds = event.matches.map((m: any) => m.id);
  const allPredictions = await prisma.prediction.findMany({
    where: { matchId: { in: matchIds } },
    select: { matchId: true, predictedWinnerId: true },
  });

  const communityStatsMap: Record<string, any[]> = {};
  matchIds.forEach((mId: string) => {
    const predictionsForMatch = allPredictions.filter((p: any) => p.matchId === mId);
    const total = predictionsForMatch.length;
    if (total === 0) {
      communityStatsMap[mId] = [];
      return;
    }
    const counts: Record<string, number> = {};
    predictionsForMatch.forEach((p: any) => {
      if (p.predictedWinnerId) {
        counts[p.predictedWinnerId] = (counts[p.predictedWinnerId] || 0) + 1;
      }
    });
    communityStatsMap[mId] = Object.entries(counts).map(([winnerId, count]) => ({
      winnerId,
      percentage: Math.round((count / total) * 100),
    }));
  });

  const now = new Date();
  // Live mode only activates when admin explicitly sets startTime
  const startTime = event.startTime ? new Date(event.startTime) : new Date(event.date);
  const endTime = event.endTime
    ? new Date(event.endTime)
    : event.startTime
    ? new Date(startTime.getTime() + 4 * 60 * 60 * 1000)
    : null;

  const isLive = !!event.startTime && now >= startTime && (endTime === null || now <= endTime);
  const isUpcoming = !isLive && now < startTime;
  const isArchive = !isLive && !isUpcoming;

  // For archive mode: check if there's a chat transcript worth showing
  const hasChatTranscript = isArchive
    ? (await prisma.liveComment.count({ where: { eventId: event.id } })) > 0
    : false;

  // Completion stats for user
  const totalMatches = event.matches.length;
  const ratedMatches = processedMatches.filter((m: any) => m.userRating > 0).length;
  const completionPercentage = totalMatches > 0 ? (ratedMatches / totalMatches) * 100 : 0;

  const averageRating = event.reviews.length
    ? parseFloat(
        (
          event.reviews.reduce((a: number, b: any) => a + b.rating, 0) /
          event.reviews.length
        ).toFixed(2),
      )
    : null;

  const userReview = userId
    ? event.reviews.find((r: any) => r.userId === userId) ?? null
    : null;

  let inWatchList: any = null;
  try {
    inWatchList = user
      ? await prisma.watchListItem.findFirst({
          where: { userId: user.id, eventId: event.id },
        })
      : null;
  } catch (err) {
    console.error("Watchlist fetch error:", err);
  }

  const watchCount = await prisma.watchListItem.count({
    where: { eventId: event.id },
  });

  // Ranking — uses per-request cache to avoid duplicate full-table scans
  const { ranked, globalAverage, minReviews } = await getGlobalRankingData();
  const top10 = ranked.slice(0, 10);
  const eventRank = top10.findIndex((e) => e.id === event.id);

  // duration is stored in seconds
  const totalMatchDuration = processedMatches.reduce(
    (sum: number, m: any) => sum + (m.duration || 0),
    0,
  );
  const topMatch =
    processedMatches.length > 0
      ? processedMatches.reduce(
          (best: any, m: any) => (m.averageRating > best.averageRating ? m : best),
          processedMatches[0],
        )
      : null;
  const durationHours = Math.floor(totalMatchDuration / 3600);
  const durationMins = Math.floor((totalMatchDuration % 3600) / 60);
  const durationSecs = totalMatchDuration % 60;
  const durationStr =
    totalMatchDuration > 0
      ? durationHours > 0
        ? `${durationHours}h ${durationMins}m`
        : `${durationMins}m ${durationSecs}s`
      : null;

  // "You Might Also Like" — same promotion, re-uses the cached ranked list
  const relatedEvents = ranked
    .filter((e) => e.id !== event.id && e.promotion === event.promotion)
    .slice(0, 4);

  const [c1, c2, c3] = await getPosterColors(event.posterUrl);

  return (
    <div className="min-h-screen pb-20">
      {/* Poster colour gradient backdrop */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 15% 10%, rgba(${c1},0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 20%, rgba(${c2},0.35) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(${c3},0.25) 0%, transparent 70%)
          `,
        }}
      />
      <div className="fixed inset-0 z-0 bg-background/80" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 relative z-10">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Events
        </Link>

        {/* Mobile-first Title & Metadata Header */}
        <div className="space-y-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-primary"></div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
                  {isUpcoming ? "Upcoming Event" : isLive ? "Live Now" : "Archive Record"}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded text-[9px] font-black uppercase tracking-widest animate-pulse">
                    <Activity className="w-2.5 h-2.5" /> Live
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] break-words hyphens-auto">
                {event.title.replace(/–\s\d{4}-\d{2}-\d{2}$/, "")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.venue ? (
                    <>
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        {event.venue}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        Archive Record
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-10 items-start">
          {/* Left Column: Poster & Quick Info */}
          <div className="space-y-6 lg:sticky lg:top-28">
            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group max-w-[320px] mx-auto lg:mx-0">
              <Image
                src={event.posterUrl || "/placeholder.png"}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {eventRank !== -1 && (
                <div className="absolute top-4 left-4">
                  <div className="bg-yellow-400 text-black px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter flex items-center gap-1.5 shadow-xl">
                    <Trophy className="w-3 h-3 fill-current" />
                    Top 10 Rated (# {eventRank + 1})
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Promotion
                </span>
                <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase rounded-lg shadow-sm whitespace-nowrap">
                  {event.promotion}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Type
                </span>
                <span className="text-xs font-bold capitalize italic text-white/90 text-right">
                  {event.type || "Special Event"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Community
                </span>
                <div className="flex items-center gap-1.5 text-primary shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-black italic">
                    {averageRating?.toFixed(2) || "0.00"}
                  </span>
                  <VisualRating rating={averageRating || 0} size="xs" />
                </div>
              </div>

              {userReview && (
                <div className="flex justify-between items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                    Your Rating
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < userReview.rating ? "text-primary fill-current" : "text-muted-foreground/20"}`}
                      />
                    ))}
                    <span className="text-xs font-black italic text-primary ml-1">{userReview.rating.toFixed(1)}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border">
                <div className="flex gap-2 items-center overflow-x-auto no-scrollbar">
                  {user && (
                    <>
                      <WatchlistIcon
                        eventId={event.id}
                        initialActive={inWatchList ? (inWatchList as any).watchlist : false}
                      />
                      <WatchedIcon
                        eventId={event.id}
                        initialActive={inWatchList ? inWatchList.watched : false}
                      />
                      <AttendButton 
                        eventId={event.id}
                        initialAttended={(inWatchList as any)?.attended || false}
                        minimal={true}
                      />
                      <SetThemeButton eventId={event.id} minimal={true} />
                    </>
                  )}
                  <ShareButton minimal={true} />
                </div>
              </div>

              {/* Completion Progress for Archived Shows */}
              {isArchive && totalMatches > 0 && (
                <div className="pt-6 border-t border-border space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Card Progress</span>
                    <span className="text-primary">{ratedMatches}/{totalMatches} Rated</span>
                  </div>
                  <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold italic text-muted-foreground/60 leading-tight">
                    {completionPercentage === 100 
                      ? "✨ Card Completed! You're a true completionist." 
                      : `Rate ${totalMatches - ratedMatches} more match${totalMatches - ratedMatches === 1 ? "" : "es"} to finish the card.`}
                  </p>
                </div>
              )}

              {/* Countdown for Upcoming */}
              {isUpcoming && (
                <div className="pt-6 border-t border-border space-y-4">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary italic">
                      <Clock className="w-3 h-3" /> Event Countdown
                   </div>
                   <Countdown targetDate={startTime} />
                </div>
              )}

              {/* Live Status for Sidebar */}
              {isLive && (
                <div className="pt-6 border-t border-border space-y-3">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-red-500 italic">
                      <Activity className="w-3 h-3 animate-pulse" /> Live Now
                   </div>
                   <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                      <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-1 text-center">Watch Party Active</p>
                      <p className="text-[9px] text-muted-foreground text-center">Join the conversation on the right.</p>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-12 pb-12">
            <div className="relative">
              <div className="hidden sm:block absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-full"></div>
              <p className="sm:pl-6 text-lg sm:text-xl text-foreground font-medium italic leading-relaxed max-w-3xl">
                {event.description ||
                  "The curtains are drawn on this chapter of history. No description has been salvaged yet."}
              </p>
            </div>

            {/* At a Glance Dashboard */}
            {processedMatches.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {processedMatches.length}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Matches Card
                  </span>
                </div>
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {durationStr ?? "—"}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                    Card Duration
                  </span>
                </div>
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-primary fill-current" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-primary tracking-tighter">
                      {topMatch && topMatch.averageRating > 0
                        ? topMatch.averageRating.toFixed(2)
                        : "—"}
                    </span>
                    {topMatch && topMatch.averageRating > 0 && (
                      <VisualRating rating={topMatch.averageRating} size="xs" />
                    )}
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/60 whitespace-nowrap">
                    Peak Performance
                  </span>
                </div>
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {watchCount}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                    Watchers
                  </span>
                </div>
              </div>
            )}

            {/* ── Event Tabs ───────────────────────────────────────────────── */}
            {(() => {
              // ── Card tab content ─────────────────────────────────────────
              const cardContent = processedMatches.length > 0 ? (
                <MatchList
                  matches={processedMatches as any}
                  user={user}
                  motNMatchId={topMatch && topMatch.averageRating > 0 ? topMatch.id : undefined}
                  compact={isUpcoming}
                />
              ) : (
                <div className="bg-card/30 border border-border border-dashed rounded-[2rem] p-20 text-center">
                  <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold italic">
                    {isUpcoming ? "No matches announced yet." : "No matches have been logged for this event."}
                  </p>
                </div>
              );

              // ── Predictions tab (upcoming = make picks, archive = results) ──
              const matchesWithPredictions = processedMatches.filter(
                (m: any) => m.participants?.length > 0 && communityStatsMap[m.id]?.length > 0
              );

              let predictionsContent: React.ReactNode = undefined;

              // Upcoming: show the prediction picker as its own tab
              if (isUpcoming && event.enablePredictions && processedMatches.length > 0) {
                const matchesWithParticipants = processedMatches.filter((m: any) => m.participants?.length > 0);
                predictionsContent = matchesWithParticipants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {matchesWithParticipants.map((match: any) => (
                      <PredictionCard
                        key={match.id}
                        match={match}
                        user={user}
                        initialPredictionId={match.userPrediction}
                        communityStats={communityStatsMap[match.id]}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-card/30 border border-border border-dashed rounded-[2rem] p-20 text-center">
                    <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold italic">No participants announced yet.</p>
                  </div>
                );
              }

              // Archive: show resolved picks
              if (isArchive && event.enablePredictions && matchesWithPredictions.length > 0) {
                const resolvedPicks = processedMatches.filter((m: any) => m.userPredictionIsCorrect !== null);
                const correctPicks = resolvedPicks.filter((m: any) => m.userPredictionIsCorrect === true).length;
                predictionsContent = (
                  <div className="space-y-6">
                    {resolvedPicks.length > 0 && user && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card/40 text-sm font-black italic w-fit">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-primary">{correctPicks}</span>
                        <span className="text-muted-foreground">/ {resolvedPicks.length} correct</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {matchesWithPredictions.map((match: any) => (
                        <PredictionCard
                          key={match.id}
                          match={match}
                          user={user}
                          initialPredictionId={match.userPrediction}
                          communityStats={communityStatsMap[match.id]}
                          readOnly
                          userPredictionIsCorrect={match.userPredictionIsCorrect}
                        />
                      ))}
                    </div>
                  </div>
                );
              }

              // ── Watch Party tab (live = active chat, archive = transcript) ──
              let watchPartyContent: React.ReactNode = undefined;
              if (event.enableWatchParty) {
                if (isLive) {
                  watchPartyContent = <LiveChatContainer eventId={event.id} user={user} fullWidth />;
                } else if (isArchive && hasChatTranscript) {
                  watchPartyContent = <LiveChatContainer eventId={event.id} user={user} fullWidth readOnly />;
                }
              }

              // ── Review tab (archive only) ────────────────────────────────
              let reviewContent: React.ReactNode = undefined;
              if (isArchive) {
                reviewContent = (
                  <div className="grid xl:grid-cols-2 gap-12">
                    {/* Review Form */}
                    <div className="space-y-6">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                        Write a Review
                      </h2>
                      <div className="bg-card border border-border rounded-[2rem] p-8">
                        {user ? (
                          <ReviewForm event={event} user={user} initialReview={userReview} />
                        ) : (
                          <div className="text-center py-6">
                            <p className="italic font-bold text-muted-foreground mb-4">
                              You must enter the arena to leave a review.
                            </p>
                            <Link href="/login" className="btn-primary inline-block">
                              Login Now
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Recent Reviews List */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                          Fan Reactions
                        </h2>
                        <Link
                          href={`/events/${event.slug}/reviews/popular`}
                          className="text-xs font-black uppercase text-primary hover:underline"
                        >
                          See All
                        </Link>
                      </div>
                      {(() => {
                        const reviews = event.reviews || [];
                        const userLatestReview: Record<string, any> = {};
                        reviews.forEach((r: any) => {
                          const uid = r.userId || r.id; // fallback if userId missing
                          if (!userLatestReview[uid]) {
                            userLatestReview[uid] = r;
                          }
                        });
                        
                        let displayReviews = Object.values(userLatestReview);
                        
                        // If specific reviewId is in URL, prioritize it at the top
                        if (reviewId && typeof reviewId === "string") {
                          const highlightedIndex = displayReviews.findIndex(r => r.id === reviewId);
                          if (highlightedIndex !== -1) {
                            const [highlighted] = displayReviews.splice(highlightedIndex, 1);
                            displayReviews = [highlighted, ...displayReviews];
                          }
                        }
                        
                        displayReviews = displayReviews.slice(0, 1);
                        
                        return displayReviews.length > 0 ? (
                          <div className="space-y-4">
                            {displayReviews.map((review: any) => (
                            <div
                              key={review.id}
                              id={`review-${review.id}`}
                              className={`bg-card border rounded-2xl p-6 transition-all relative group ${
                                review.id === reviewId
                                  ? "border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5"
                                  : "border-border hover:border-primary/30"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-4">
                                {review.user ? (
                                  <Link href={`/users/${review.user.slug || review.user.id}`} className="flex items-center gap-3 group/user">
                                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-white group-hover/user:ring-2 group-hover/user:ring-primary/50 transition-all overflow-hidden relative">
                                    {review.user?.avatarUrl ? (
                                      <Image src={review.user.avatarUrl} fill className="object-cover" alt="" />
                                    ) : (
                                      review.user?.name ? review.user.name.charAt(0).toUpperCase() : "A"
                                    )}
                                  </div>
                                  <span className="text-sm font-black italic flex items-center gap-1 group-hover/user:text-primary transition-colors">
                                    {review.user?.name || "Anonymous"}
                                    {(review.user as any)?.isVerified && (
                                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-400/10" />
                                    )}
                                  </span>
                                </Link>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-white/20">
                                      U
                                    </div>
                                    <span className="font-black text-sm uppercase italic tracking-tight text-white/20">
                                      Anonymous
                                    </span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-primary">
                                  <VisualRating rating={review.rating} size="sm" />
                                </div>
                                <ShareReviewButton
                                  review={review}
                                  event={{ title: event.title, posterUrl: event.posterUrl, promotion: event.promotion }}
                                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-primary active:scale-90"
                                />
                              </div>
                              <p className="text-sm text-foreground/80 font-medium italic leading-relaxed">
                                "{review.comment}"
                              </p>
                              {review.Reply && review.Reply.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border space-y-3 text-left">
                                  {review.Reply.slice(0, 1).map((reply: any) => (
                                    <div
                                      key={reply.id}
                                      className="flex flex-col gap-1 text-xs bg-secondary/50 p-3 rounded-xl italic leading-snug"
                                    >
                                      <span className="font-black text-primary uppercase shrink-0">{reply.user?.name}</span>
                                      <span className="text-muted-foreground break-words">{reply.comment}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="mt-4 pt-4 border-t border-border flex flex-col items-start gap-4">
                                <ReviewUpvote
                                  reviewId={review.id}
                                  initialCount={review.votes?.length || 0}
                                  initialVoted={review.votes?.some((v: any) => v.userId === userId)}
                                  isLoggedIn={!!user}
                                />
                                <div className="w-full">{user && <ReplyForm reviewId={review.id} />}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        ) : (
                          <p className="italic text-muted-foreground font-medium p-12 text-center bg-secondary/20 rounded-[2rem]">
                            Silence from the crowd. No reviews yet.
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                );
              }

              // ── Build tabs list (only include what's relevant) ────────────
              const tabs: EventTab[] = [
                { id: "card", label: "Card", badge: processedMatches.length },
              ];
              if (predictionsContent) {
                tabs.push({ id: "predictions", label: "Predictions", badge: isArchive ? matchesWithPredictions.length : undefined });
              }
              if (watchPartyContent) {
                tabs.push({ id: "watchParty", label: isLive ? "Watch Party 🔴" : "Watch Party" });
              }
              if (reviewContent) {
                tabs.push({ id: "review", label: "Reviews", badge: event.reviews.length });
              }

              // Default to Watch Party tab when event is live
              const defaultTab = isLive ? "watchParty" : "card";

              return (
                <EventTabs
                  tabs={tabs}
                  defaultTab={defaultTab}
                  card={cardContent}
                  predictions={predictionsContent}
                  watchParty={watchPartyContent}
                  review={reviewContent}
                />
              );
            })()}
          </div>
        </div>

        {/* You Might Also Like */}
        {relatedEvents.length > 0 && (
          <section className="pt-16 pb-4 relative z-10">
            <div>
              <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">
                  More from {event.promotion}
                </h2>
                <Link
                  href={`/events?promotion=${encodeURIComponent(event.promotion)}`}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline border border-primary/20 bg-primary/5 px-4 py-2 rounded-full"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {relatedEvents.map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={`/events/${rel.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/5">
                      <Image
                        src={rel.posterUrl || "/placeholder.png"}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {rel.reviewCount > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-primary fill-current" />
                          <span className="text-[10px] font-black text-white">
                            {rel.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-xs uppercase italic tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {rel.title.replace(/–\s\d{4}.*$/, "")}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">
                      {new Date(rel.date).getFullYear()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
