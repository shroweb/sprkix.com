import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (
  _req: NextRequest,
  ctx: any
) => {
  const { slug } = await ctx.params;

  const event = await prisma.event.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      date: true,
      promotion: true,
      venue: true,
      posterUrl: true,
      description: true,
      type: true,
      startTime: true,
      endTime: true,
      enableWatchParty: true,
      enablePredictions: true,
      createdAt: true,
      _count: { select: { reviews: true, matches: true } },
      reviews: {
        select: { rating: true },
      },
      matches: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          title: true,
          type: true,
          duration: true,
          rating: true,
          result: true,
          order: true,
          participants: {
            select: {
              id: true,
              team: true,
              isWinner: true,
              wrestler: {
                select: { id: true, name: true, slug: true, imageUrl: true },
              },
            },
          },
        },
      },
    },
  });

  if (!event) return err("Event not found", 404);

  const avg =
    event.reviews.length > 0
      ? event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length
      : null;

  const { reviews, _count, ...rest } = event;

  return ok({
    ...rest,
    reviewCount: _count.reviews,
    matchCount: _count.matches,
    averageRating: avg !== null ? Math.round(avg * 100) / 100 : null,
  });
});
