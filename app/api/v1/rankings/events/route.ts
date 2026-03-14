import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const MIN_REVIEWS = 3; // Bayesian confidence threshold

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const promotion = searchParams.get("promotion");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  const where: any = {};
  if (promotion) where.promotion = { equals: promotion, mode: "insensitive" };

  const events = await prisma.event.findMany({
    where,
    select: {
      id: true,
      title: true,
      slug: true,
      date: true,
      promotion: true,
      venue: true,
      posterUrl: true,
      type: true,
      reviews: { select: { rating: true } },
    },
  });

  // Bayesian weighted rating: (v/(v+m)) * R + (m/(v+m)) * C
  const allRatings = events.flatMap((e) => e.reviews.map((r) => r.rating));
  const C = allRatings.length > 0 ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length : 0;
  const m = MIN_REVIEWS;

  const ranked = events
    .filter((e) => e.reviews.length > 0)
    .map((e) => {
      const v = e.reviews.length;
      const R = e.reviews.reduce((s, r) => s + r.rating, 0) / v;
      const score = (v / (v + m)) * R + (m / (v + m)) * C;
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        date: e.date,
        promotion: e.promotion,
        venue: e.venue,
        posterUrl: e.posterUrl,
        type: e.type,
        reviewCount: v,
        averageRating: Math.round(R * 100) / 100,
        bayesianScore: Math.round(score * 1000) / 1000,
      };
    })
    .sort((a, b) => b.bayesianScore - a.bayesianScore)
    .slice(0, limit);

  return ok(ranked, { total: ranked.length });
});
