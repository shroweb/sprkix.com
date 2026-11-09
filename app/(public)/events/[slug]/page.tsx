import Link from "next/link";
import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPosterColors } from "@lib/poster-color";
import { getEventRanking } from "@lib/cached-data";
import { getSiteUrl, jsonLdString, breadcrumbLd } from "@lib/seo";
import ReviewForm from "@components/ReviewForm";
import ReplyForm from "@components/ReplyForm";
import { getUserFromServerCookie } from "@lib/server-auth";
import MatchList from "@components/MatchList";
import ShareButton from "@components/ShareButton";
import ShareReviewButton from "@components/ShareReviewButton";
import ReviewUpvote from "@components/ReviewUpvote";
import AttendButton from "@components/AttendButton";
import SetThemeButton from "@components/SetThemeButton";
import { Calendar, Clock, Star, ChevronLeft, Info, Trophy, MapPin, CheckCircle, Activity, Users, Tv, Send } from "lucide-react";
import PredictionCard from "@components/PredictionCard";
import PredictionSlip from "@components/PredictionSlip";
import RecapCard from "@components/RecapCard";
import { getRecap } from "@lib/recap";
import HomePoll from "@components/HomePoll";
import LiveChatContainer from "@components/LiveChatContainer";
import Countdown from "@components/Countdown";
import EventTabs, { type EventTab } from "@components/EventTabs";
import EventComments from "@components/EventComments";
import WatchlistIcon from "@components/WatchlistIcon";
import WatchedIcon from "@components/WatchedIcon";
import AddToListButton from "@components/AddToListButton";
import VisualRating from "@components/VisualRating";
import RatingDistribution from "@components/RatingDistribution";
import WhereToWatchBadge from "@components/WhereToWatchBadge";
import type { Metadata } from "next";

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
  // Trim at a word boundary so previews never end mid-word
  const trimDesc = (t: string, max = 155) => {
    const text = t.replace(/\s+/g, " ").trim();
    if (text.length <= max) return text;
    const cut = text.slice(0, max);
    return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 80)).replace(/[\s,;:.\-–]+$/, "")}…`;
  };
  const desc = event.description
    ? trimDesc(event.description)
    : `Ratings, reviews and match results for ${cleanTitle} (${year}) by ${event.promotion}.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";

  // Only pass poster to OG endpoint if it's a real hosted URL (not base64)
  const rawPoster = event.posterUrl || "";
  const hostedPoster = rawPoster.startsWith("http")
    ? rawPoster
    : rawPoster.startsWith("/") && !rawPoster.startsWith("/9j")
    ? `${siteUrl}${rawPoster}`
    : "";

  // Always use the dynamic OG image endpoint — works even if poster is base64
  const ogParams = new URLSearchParams({
    title: cleanTitle,
    promotion: event.promotion,
    year: String(year),
    ...(hostedPoster ? { poster: hostedPoster } : {}),
  });
  const ogImageUrl = `${siteUrl}/api/og?${ogParams.toString()}`;

  return {
    title: `${cleanTitle} (${year}) – ${event.promotion}`,
    description: desc,
    alternates: { canonical: `${siteUrl}/events/${slug}` },
    openGraph: {
      url: `${siteUrl}/events/${slug}`,
      title: `${cleanTitle} – ${event.promotion}`,
      description: desc,
      images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${cleanTitle} – ${event.promotion} poster` }],
      siteName: "Poison Rana",
      locale: "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${cleanTitle} – ${event.promotion}`,
      description: desc,
      images: [ogImageUrl],
    },
  };
}

function formatEventType(type?: string | null): string {
  const t = (type ?? "").trim();
  if (!t) return "Special event";
  const known: Record<string, string> = { ppv: "PPV", ple: "Premium live event", weekly: "Weekly show", tv: "TV show", house: "House show", special: "Special event" };
  const k = known[t.toLowerCase()];
  if (k) return k;
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
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
    city: true,
    attendance: true,
    network: true,
    wikiUrl: true,
    posterUrl: true,
    description: true,
    type: true,
    tmdbId: true,
    profightdbUrl: true,
    startTime: true,
    endTime: true,
    currentMatchOrder: true,
    enablePredictions: true,
    enableWatchParty: true,
    submittedByUserId: true,
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
            user: {
              select: {
                id: true, name: true, slug: true, avatarUrl: true,
                isAdmin: true, isVerified: true, favoritePromotion: true,
                createdAt: true, predictionScore: true, predictionCount: true,
                profileThemeEventId: true,
              },
            },
            Reply: {
              include: {
                user: {
                  select: {
                    id: true, name: true, slug: true, avatarUrl: true,
                    isAdmin: true, isVerified: true,
                  },
                },
              },
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

  // If this event was user-submitted, fetch the submitter's name/slug for the badge
  let submittedByUser: { name: string | null; slug: string } | null = null;
  if (event.submittedByUserId) {
    submittedByUser = await prisma.user.findUnique({
      where: { id: event.submittedByUserId },
      select: { name: true, slug: true },
    });
  }

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
      count,
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
  const commentCount = await prisma.eventComment.count({ where: { eventId: event.id, parentId: null } }).catch(() => 0);
  const recap = isArchive && user && event.enablePredictions ? await getRecap(event.slug, user.id).catch(() => null) : null;

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
          select: { id: true, watchlist: true, watched: true, attended: true },
        })
      : null;
  } catch (err) {
    console.error("Watchlist fetch error:", err);
  }

  const watchCount = await prisma.watchListItem.count({
    where: { eventId: event.id },
  });

  // Event polls
  const eventPolls = await prisma.poll.findMany({
    where: { eventId: event.id },
    include: {
      options: {
        orderBy: { order: "asc" },
        include: { _count: { select: { votes: true } } },
      },
      votes: userId ? { where: { userId }, select: { optionId: true, pollId: true } } : false,
    },
    orderBy: { createdAt: "asc" },
  });

  // Ranking — shared cross-request cache built from DB aggregates
  const { ranked } = await getEventRanking(10);
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

  const [c1, c2] = await getPosterColors(event.posterUrl);

  // Structured data for rich results (Google Event / SportsEvent)
  const siteUrl = getSiteUrl();
  const eventUrl = `${siteUrl}/events/${event.slug}`;
  const startsAt: Date = event.startTime ?? event.date;
  const performers = Array.from(
    new Map(
      event.matches
        .flatMap((m: any) => m.participants ?? [])
        .filter((p: any) => p.wrestler?.slug)
        .map((p: any) => [p.wrestler.slug, p.wrestler]),
    ).values(),
  )
    .slice(0, 30)
    .map((w: any) => ({
      "@type": "Person",
      name: w.name,
      url: `${siteUrl}/wrestlers/${w.slug}`,
    }));
  const reviewCount = event.reviews.length;
  const avgReview = reviewCount
    ? event.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewCount
    : 0;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsEvent",
    name: event.title,
    startDate: startsAt.toISOString(),
    endDate: event.endTime ? event.endTime.toISOString() : undefined,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    sport: "Professional wrestling",
    location:
      event.venue || event.city
        ? {
            "@type": "Place",
            name: event.venue || event.city,
            address: event.city
              ? { "@type": "PostalAddress", addressLocality: event.city }
              : undefined,
          }
        : undefined,
    image: event.posterUrl?.startsWith("http") ? event.posterUrl : undefined,
    description: event.description || `${event.title} presented by ${event.promotion}`,
    organizer: { "@type": "Organization", name: event.promotion },
    performer: performers.length ? performers : undefined,
    aggregateRating:
      reviewCount > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(avgReview.toFixed(2)),
            reviewCount,
            bestRating: 5,
            worstRating: 0,
          }
        : undefined,
    url: eventUrl,
  };
  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Events", path: "/events" },
    { name: event.title, path: `/events/${event.slug}` },
  ]);

  return (
    <div className="relative min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />
      {/* Poster colour glow: a soft, top-anchored wash that fades to the page background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 left-1/2 z-0 h-[680px] w-screen -translate-x-1/2"
        style={{
          background: `
            radial-gradient(ellipse 60% 70% at 50% 0%, rgba(${c1},0.20) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 100% 0%, rgba(${c2},0.12) 0%, transparent 70%)
          `,
          WebkitMaskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 0%, #000 45%, transparent 100%)",
        }}
      />

      <div className="relative z-10 pt-1 sm:pt-3">
        {/* Back Link */}
        <Link href="/events" className="group mb-5 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground/75 transition-colors hover:text-primary sm:mb-6">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Events
        </Link>

        {/* Mobile-first Title & Metadata Header */}
        <div className="space-y-6 mb-8 sm:mb-10 border border-white/10 bg-black/60 backdrop-blur-xl p-5 sm:p-8 lg:p-10 shadow-2xl shadow-black/30">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-primary"></div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary ">
                  {isUpcoming ? "Upcoming Event" : isLive ? "Live Now" : "Archive Record"}
                </span>
                {isLive && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500 text-white rounded text-[11px] font-bold uppercase tracking-wider animate-pulse">
                    <Activity className="w-2.5 h-2.5" /> Live
                  </span>
                )}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] break-words hyphens-auto">
                {event.title.replace(/–\s\d{4}-\d{2}-\d{2}$/, "")}
              </h1>
              <div className="flex flex-wrap items-center gap-2 text-foreground">
                <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                {(event.venue || event.city) && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                      {[event.venue, event.city].filter(Boolean).join(" · ")}
                    </span>
                  </div>
                )}
                {event.attendance && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2">
                    <Users className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                      {event.attendance.toLocaleString()} Attendance
                    </span>
                  </div>
                )}
                <WhereToWatchBadge
                  promotion={event.promotion}
                  network={event.network}
                  title={event.title}
                  variant="header-pill"
                />
                {!event.venue && !event.city && !isUpcoming && (
                  <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-black/40 px-3 py-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Archive Record</span>
                  </div>
                )}
              </div>
              {submittedByUser && (
                <div className="flex items-center gap-2 mt-1">
                  <Link
                    href={`/users/${submittedByUser.slug}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/5 border border-primary/20 rounded-full text-[11px] font-bold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Send className="w-3 h-3" />
                    Submitted by {submittedByUser.name || submittedByUser.slug}
                  </Link>
                </div>
              )}
              {event.description && (
                <p className="max-w-3xl border-t border-white/10 pt-5 text-base leading-7 text-foreground/90 sm:text-lg sm:leading-8">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] xl:grid-cols-[330px_1fr] gap-7 lg:gap-10 items-start">
          {/* Left Column: Poster & Quick Info */}
          <div className="order-2 space-y-5 lg:order-1 lg:sticky lg:top-24">
            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group max-w-[200px] sm:max-w-[260px] lg:max-w-[320px] mx-auto lg:mx-0">
              <Image
                src={event.posterUrl || "/placeholder.svg"}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {eventRank !== -1 && (
                <div className="absolute top-4 left-4">
                  <div className="bg-yellow-400 text-black px-3 py-1.5 rounded-xl font-bold text-[11px] uppercase tracking-tighter flex items-center gap-1.5 shadow-xl">
                    <Trophy className="w-3 h-3 fill-current" />
                    Top 10 Rated (# {eventRank + 1})
                  </div>
                </div>
              )}
            </div>

            <aside aria-label="Event details and actions" className="bg-slate-950/85 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/30">
              <dl className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Promotion</dt>
                  <dd className="mt-2">
                    <span className="inline-flex rounded-lg bg-primary px-2.5 py-1 text-[11px] font-bold uppercase text-black">
                      {event.promotion}
                    </span>
                  </dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Event type</dt>
                  <dd className="mt-2 truncate text-xs font-bold text-white/90" title={formatEventType(event.type)}>
                    {formatEventType(event.type)}
                  </dd>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <div>
                    <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Community rating</dt>
                    {averageRating ? (
                      <dd className="mt-1 flex items-baseline gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                        <span className="text-lg font-black italic text-primary">{averageRating.toFixed(2)}</span>
                        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">out of 5</span>
                      </dd>
                    ) : (
                      <dd className="mt-1 text-xs font-bold text-muted-foreground">
                        {isUpcoming ? "Opens once the show airs" : "No ratings yet. Be the first."}
                      </dd>
                    )}
                  </div>
                  {averageRating ? <VisualRating rating={averageRating} size="xs" /> : null}
                </div>
                <div className="col-span-2 rounded-xl border border-white/10 bg-white/[0.04] p-3">
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Where to watch
                  </dt>
                  <dd>
                    <WhereToWatchBadge
                      promotion={event.promotion}
                      network={event.network}
                      title={event.title}
                      variant="details"
                    />
                  </dd>
                </div>
              </dl>

              {userReview && (
                <div className="mt-3 flex justify-between items-center gap-4 rounded-xl border border-primary/15 bg-primary/5 p-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                    Your Rating
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < userReview.rating ? "text-primary fill-current" : "text-muted-foreground/80"}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-primary ml-1">{userReview.rating.toFixed(1)}</span>
                  </div>
                </div>
              )}

              <div className="mt-4 border-t border-white/10 pt-4">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Your event</p>
                <div className="grid grid-cols-3 gap-x-2 gap-y-4">
                  {user && (
                    <>
                      <div className="flex min-w-0 flex-col items-center gap-1.5"><WatchlistIcon eventId={event.id} initialActive={inWatchList ? (inWatchList as any).watchlist : false} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Watchlist</span></div>
                      <div className="flex min-w-0 flex-col items-center gap-1.5"><WatchedIcon eventId={event.id} initialActive={inWatchList ? inWatchList.watched : false} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Watched</span></div>
                      <div className="flex min-w-0 flex-col items-center gap-1.5"><AttendButton eventId={event.id} initialAttended={(inWatchList as any)?.attended || false} minimal={true} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Attended</span></div>
                      <div className="flex min-w-0 flex-col items-center gap-1.5"><SetThemeButton eventId={event.id} minimal={true} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Theme</span></div>
                      <div className="flex min-w-0 flex-col items-center gap-1.5"><AddToListButton eventId={event.id} isLoggedIn={!!user} minimal={true} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Add to list</span></div>
                    </>
                  )}
                  <div className="flex min-w-0 flex-col items-center gap-1.5"><ShareButton minimal={true} /><span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Share</span></div>
                </div>
              </div>

              {/* Completion Progress for Archived Shows */}
              {isArchive && totalMatches > 0 && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <div className="mb-3 flex justify-between items-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    <span>Card Progress</span>
                    <span className="text-primary">{ratedMatches}/{totalMatches} Rated</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Match card rating progress" aria-valuemin={0} aria-valuemax={totalMatches} aria-valuenow={ratedMatches}>
                    <div 
                      className="h-full rounded-full bg-primary transition-all duration-1000 ease-out"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                  <p className="mt-2.5 text-[11px] font-medium text-muted-foreground leading-relaxed">
                    {completionPercentage === 100 
                      ? "✨ Card Completed! You're a true completionist." 
                      : `Rate ${totalMatches - ratedMatches} more match${totalMatches - ratedMatches === 1 ? "" : "es"} to finish the card.`}
                  </p>
                </div>
              )}

              {/* Countdown for Upcoming */}
              {isUpcoming && (
                <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                   <div className="flex items-center justify-between gap-2 text-[11px] font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-2 text-primary "><Clock className="w-3 h-3" /> Starts in</span>
                      <span className="text-muted-foreground font-bold normal-case tracking-normal">
                        {new Date(startTime).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })}
                      </span>
                   </div>
                   <Countdown targetDate={startTime} />
                </div>
              )}

              {/* Live Status for Sidebar */}
              {isLive && (
                <div className="mt-6 border-t border-white/10 pt-4 space-y-3">
                   <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-red-500 ">
                      <Activity className="w-3 h-3 animate-pulse" /> Live Now
                   </div>
                   <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl">
                      <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider mb-1 text-center">Watch Party Active</p>
                      <p className="text-[11px] text-muted-foreground text-center">Join the conversation on the right.</p>
                   </div>
                </div>
              )}
            </aside>
          </div>

          {/* Right Column: Content */}
          <div className="order-1 min-w-0 space-y-6 sm:space-y-10 lg:order-2">
            {/* At a Glance Dashboard */}
            {processedMatches.length > 0 && (
              <div className="grid gap-3 md:gap-4 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
                <div className="bg-black/60 border border-white/15 rounded-2xl md:rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {processedMatches.length}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground/75">
                    Matches on this Card
                  </span>
                </div>
                {!isUpcoming && (
                  <div className="bg-black/60 border border-white/15 rounded-2xl md:rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5 text-center hover:bg-card/60 transition-colors shadow-lg">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                      {durationStr ?? "—"}
                    </span>
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground/75 whitespace-nowrap">
                      Card Duration
                    </span>
                  </div>
                )}
                <div className="bg-black/60 border border-white/15 rounded-2xl md:rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5 text-center hover:bg-card/60 transition-colors shadow-lg">
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
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                    Peak Performance
                  </span>
                </div>
                <div className="bg-black/60 border border-white/15 rounded-2xl md:rounded-3xl p-4 sm:p-5 flex flex-col items-center justify-center gap-1.5 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {watchCount}
                  </span>
                  <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground/75 whitespace-nowrap">
                    Watchers
                  </span>
                </div>
              </div>
            )}

          <div className="mt-8">
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
                <div className="bg-card/85 border border-border border-dashed rounded-[2rem] p-8 sm:p-20 text-center">
                  <Info className="w-12 h-12 text-muted-foreground/80 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold ">
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
                  <PredictionSlip
                    matchIds={matchesWithParticipants.map((m: any) => m.id)}
                    pickedIds={matchesWithParticipants.filter((m: any) => m.userPrediction).map((m: any) => m.id)}
                    signedIn={!!user}
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                  </PredictionSlip>
                ) : (
                  <div className="bg-card/85 border border-border border-dashed rounded-[2rem] p-8 sm:p-20 text-center">
                    <Info className="w-12 h-12 text-muted-foreground/80 mx-auto mb-4" />
                    <p className="text-muted-foreground font-bold ">No participants announced yet.</p>
                  </div>
                );
              }

              // Archive: show resolved picks
              if (isArchive && event.enablePredictions && matchesWithPredictions.length > 0) {
                const resolvedPicks = processedMatches.filter((m: any) => m.userPredictionIsCorrect !== null);
                const correctPicks = resolvedPicks.filter((m: any) => m.userPredictionIsCorrect === true).length;
                predictionsContent = (
                  <div className="space-y-6">
                    {recap && user && (
                      <RecapCard
                        eventSlug={recap.eventSlug}
                        eventTitle={recap.eventTitle}
                        userSlug={(user as any).slug || user.id}
                        correct={recap.correct}
                        total={recap.total}
                        perfect={recap.perfect}
                        bestCall={recap.bestCall}
                        worstMiss={recap.worstMiss}
                      />
                    )}
                    {resolvedPicks.length > 0 && user && !recap && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card/85 text-sm font-bold w-fit">
                        <Trophy className="w-4 h-4 text-primary" />
                        <span className="text-primary">{correctPicks}</span>
                        <span className="text-muted-foreground">/ {resolvedPicks.length} correct</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                const eventRatings = (event.reviews || []).map((r: any) => r.rating);
                reviewContent = (
                  <div className="space-y-8">
                    <RatingDistribution
                      ratings={eventRatings}
                      averageRating={averageRating || undefined}
                      totalCount={event.reviews.length}
                    />
                    <div className="grid xl:grid-cols-2 gap-8 lg:gap-12">
                    {/* Review Form */}
                    <div className="space-y-6">
                      <h2 className="text-3xl font-semibold uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                        Write a Review
                      </h2>
                      <div className="bg-card border border-border rounded-[2rem] p-5 sm:p-8">
                        {user ? (
                          <ReviewForm event={event} user={user} initialReview={userReview} />
                        ) : (
                          <div className="text-center py-6">
                            <p className="font-bold text-muted-foreground mb-4">
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
                        <h2 className="text-3xl font-semibold uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                          Fan Reactions
                        </h2>
                        <Link
                          href={`/events/${event.slug}/reviews/popular`}
                          className="text-xs font-bold uppercase text-primary hover:underline"
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
                                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white group-hover/user:ring-2 group-hover/user:ring-primary/50 transition-all overflow-hidden relative">
                                    {review.user?.avatarUrl ? (
                                      <Image src={review.user.avatarUrl} fill className="object-cover" alt="" />
                                    ) : (
                                      review.user?.name ? review.user.name.charAt(0).toUpperCase() : "A"
                                    )}
                                  </div>
                                  <span className="text-sm font-bold flex items-center gap-1 group-hover/user:text-primary transition-colors">
                                    {review.user?.name || "Anonymous"}
                                    {(review.user as any)?.isVerified && (
                                      <CheckCircle className="w-3.5 h-3.5 text-blue-400 fill-blue-400/10" />
                                    )}
                                  </span>
                                </Link>
                                ) : (
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-white/20">
                                      U
                                    </div>
                                    <span className="font-bold text-sm uppercase tracking-tight text-white/20">
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
                              <p className="text-sm text-foreground/80 font-medium leading-relaxed">
                                "{review.comment}"
                              </p>
                              {review.Reply && review.Reply.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-border space-y-3 text-left">
                                  {review.Reply.slice(0, 1).map((reply: any) => (
                                    <div
                                      key={reply.id}
                                      className="flex flex-col gap-1 text-xs bg-secondary/50 p-3 rounded-xl leading-snug"
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
                          <p className="text-muted-foreground font-medium p-6 sm:p-12 text-center bg-secondary/20 rounded-[2rem]">
                            Silence from the crowd. No reviews yet.
                          </p>
                        );
                      })()}
                    </div>
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
              // Comments: open on every event (upcoming, live and archive)
              const discussionContent = <EventComments eventId={event.id} user={user ? { id: user.id, isAdmin: !!(user as any).isAdmin } : null} />;
              tabs.push({ id: "discussion", label: "Discussion", badge: commentCount });

              // ── Poll tab (show when event has polls) ─────────────────────
              let pollContent: React.ReactNode = undefined;
              if (eventPolls.length > 0) {
                pollContent = (
                  <div className="space-y-8">
                    {eventPolls.map((poll: any) => {
                      const totalVotes = poll.options.reduce(
                        (sum: number, o: any) => sum + o._count.votes,
                        0,
                      );
                      const userVoteOptionId =
                        poll.votes && poll.votes.length > 0
                          ? poll.votes[0].optionId
                          : null;
                      return (
                        <HomePoll
                          key={poll.id}
                          poll={poll}
                          totalVotes={totalVotes}
                          userVoteOptionId={userVoteOptionId}
                          isLoggedIn={!!user}
                          endsAt={poll.endsAt ? (poll.endsAt as Date).toISOString() : null}
                        />
                      );
                    })}
                  </div>
                );
                tabs.push({ id: "poll", label: "Poll", badge: eventPolls.length > 1 ? eventPolls.length : undefined });
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
                  discussion={discussionContent}
                  poll={pollContent}
                />
              );
            })()}
          </div>
        </div>
        </div>

        {/* You Might Also Like */}
        {relatedEvents.length > 0 && (
          <section className="pt-16 pb-4 relative z-10">
            <div>
              <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-10">
                <h2 className="text-2xl sm:text-3xl font-semibold uppercase italic tracking-tighter">
                  More from {event.promotion}
                </h2>
                <Link
                  href={`/events?promotion=${encodeURIComponent(event.promotion)}`}
                  className="text-[11px] font-bold uppercase tracking-wider text-primary hover:underline border border-primary/20 bg-primary/5 px-4 py-2 rounded-full"
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
                        src={rel.posterUrl || "/placeholder.svg"}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {rel.reviewCount > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-primary fill-current" />
                          <span className="text-[11px] font-bold text-white">
                            {rel.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-bold text-xs uppercase tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {rel.title.replace(/–\s\d{4}.*$/, "")}
                    </h3>
                    <p className="text-[11px] font-bold text-muted-foreground mt-1">
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
