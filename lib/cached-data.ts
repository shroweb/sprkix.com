// Cached, user-independent aggregates for public pages. Everything returned here
// must be JSON-serialisable (unstable_cache round-trips through JSON, so Dates
// become strings) and must not depend on cookies/headers.
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@lib/prisma";
import {
  rankPredictors,
  periodStart,
  type LeaderboardPeriod,
  type LeaderboardRow,
} from "@lib/leaderboard";

export const CACHE_TAGS = {
  events: "events",
  reviews: "reviews",
  predictions: "predictions",
} as const;

export interface LeaderboardEntry extends LeaderboardRow {
  name: string | null;
  slug: string;
  avatarUrl: string | null;
}

export const getLeaderboard = unstable_cache(
  async (period: LeaderboardPeriod): Promise<LeaderboardEntry[]> => {
    const since = periodStart(period);
    const raw = await prisma.prediction.findMany({
      where: {
        predictedWinnerId: { not: null },
        match: {
          participants: { some: { isWinner: true } },
          ...(since ? { event: { date: { gte: since } } } : {}),
        },
      },
      select: {
        userId: true,
        predictedWinnerId: true,
        isCorrect: true,
        match: {
          select: {
            event: { select: { date: true } },
            participants: { where: { isWinner: true }, select: { wrestlerId: true } },
          },
        },
      },
    });

    // Compute correctness ourselves when the stored flag is stale or unset.
    const ranked = rankPredictors(
      raw.map((p) => ({
        userId: p.userId,
        isCorrect:
          p.isCorrect !== null
            ? p.isCorrect
            : p.match.participants.some((mp) => mp.wrestlerId === p.predictedWinnerId),
        eventDate: p.match.event.date,
      })),
    );
    if (ranked.length === 0) return [];

    const profiles = await prisma.user.findMany({
      where: { id: { in: ranked.map((r) => r.userId) } },
      select: { id: true, name: true, slug: true, avatarUrl: true },
    });
    const byId = new Map(profiles.map((u) => [u.id, u]));
    return ranked.flatMap((r) => {
      const u = byId.get(r.userId);
      return u ? [{ ...r, name: u.name, slug: u.slug, avatarUrl: u.avatarUrl }] : [];
    });
  },
  ["leaderboard-v1"],
  { revalidate: 300, tags: [CACHE_TAGS.predictions] },
);

export interface RankedEvent {
  id: string;
  title: string;
  slug: string;
  promotion: string;
  posterUrl: string | null;
  date: string; // ISO — Date does not survive the cache
  weighted: number;
  avgRating: number;
  reviewCount: number;
}

/** Bayesian-weighted event ranking built from DB aggregates rather than every review row. */
export const getEventRanking = unstable_cache(
  async (minReviews: number) => {
    const [events, agg] = await Promise.all([
      prisma.event.findMany({
        select: { id: true, promotion: true, title: true, slug: true, posterUrl: true, date: true },
      }),
      prisma.review.groupBy({
        by: ["eventId"],
        _avg: { rating: true },
        _count: { rating: true },
        _sum: { rating: true },
      }),
    ]);
    const aggByEvent = new Map(agg.map((a) => [a.eventId, a]));

    let totalRating = 0;
    let totalCount = 0;
    for (const a of agg) {
      totalRating += a._sum.rating ?? 0;
      totalCount += a._count.rating;
    }
    const globalAverage = totalCount ? totalRating / totalCount : 0;

    const ranked: RankedEvent[] = events
      .map((e) => {
        const a = aggByEvent.get(e.id);
        const v = a?._count.rating ?? 0;
        const R = v ? (a?._avg.rating ?? 0) : 0;
        const weighted = (v / (v + minReviews)) * R + (minReviews / (v + minReviews)) * globalAverage;
        return {
          id: e.id,
          promotion: e.promotion,
          title: e.title,
          slug: e.slug,
          posterUrl: e.posterUrl,
          date: e.date.toISOString(),
          weighted,
          avgRating: R,
          reviewCount: v,
        };
      })
      .sort((a, b) => b.weighted - a.weighted);

    return { ranked, globalAverage, minReviews };
  },
  ["event-ranking-v1"],
  { revalidate: 600, tags: [CACHE_TAGS.events, CACHE_TAGS.reviews] },
);

export interface EventListItem {
  id: string;
  title: string;
  slug: string;
  date: string;
  promotion: string;
  posterUrl: string | null;
  startTime: string | null;
  endTime: string | null;
  avgRating: number;
  reviewCount: number;
}

/** Full event list with review aggregates, shared by every visitor of /events. */
export const getEventList = unstable_cache(
  async (): Promise<EventListItem[]> => {
    const [raw, agg] = await Promise.all([
      prisma.event.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true, title: true, slug: true, date: true, promotion: true,
          posterUrl: true, startTime: true, endTime: true,
        },
      }),
      prisma.review.groupBy({
        by: ["eventId"],
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);
    const byEvent = new Map(agg.map((a) => [a.eventId, a]));
    return raw.map((e) => {
      const a = byEvent.get(e.id);
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        date: e.date.toISOString(),
        promotion: e.promotion,
        posterUrl: e.posterUrl,
        startTime: e.startTime ? e.startTime.toISOString() : null,
        endTime: e.endTime ? e.endTime.toISOString() : null,
        avgRating: a?._count.rating ? (a._avg.rating ?? 0) : 0,
        reviewCount: a?._count.rating ?? 0,
      };
    });
  },
  ["event-list-v1"],
  { revalidate: 120, tags: [CACHE_TAGS.events, CACHE_TAGS.reviews] },
);

/** Mark cached aggregates stale after a write. Never throws — TTLs cover a missed call. */
export function invalidateCache(...tags: (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS][]) {
  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (err) {
      console.error(`[cache] revalidateTag(${tag}) failed:`, err);
    }
  }
}
