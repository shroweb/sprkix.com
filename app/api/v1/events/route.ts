import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || PAGE_SIZE)));
  const promotion = searchParams.get("promotion");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const sort = searchParams.get("sort") || "date_desc"; // date_desc | date_asc | rating_desc

  const upcoming = searchParams.get("upcoming"); // "true" | "false" | null

  const where: any = {};
  if (promotion) where.promotion = { equals: promotion, mode: "insensitive" };
  if (type) where.type = { equals: type, mode: "insensitive" };
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (upcoming === "true") where.date = { gte: new Date() };
  else if (upcoming === "false") where.date = { lt: new Date() };

  const orderBy: any =
    sort === "date_asc"
      ? { date: "asc" }
      : sort === "rating_desc"
      ? [{ reviews: { _count: "desc" } }, { date: "desc" }]
      : { date: "desc" };

  const [total, events] = await Promise.all([
    prisma.event.count({ where }),
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        promotion: true,
        venue: true,
        posterUrl: true,
        type: true,
        startTime: true,
        endTime: true,
        enableWatchParty: true,
        enablePredictions: true,
        _count: { select: { reviews: true, matches: true } },
        reviews: {
          select: { rating: true },
        },
      },
    }),
  ]);

  const data = events.map((e) => {
    const avg =
      e.reviews.length > 0
        ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length
        : null;
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      date: e.date,
      promotion: e.promotion,
      venue: e.venue,
      posterUrl: e.posterUrl,
      type: e.type,
      startTime: e.startTime,
      endTime: e.endTime,
      enableWatchParty: e.enableWatchParty,
      enablePredictions: e.enablePredictions,
      reviewCount: e._count.reviews,
      matchCount: e._count.matches,
      averageRating: avg !== null ? Math.round(avg * 100) / 100 : null,
    };
  });

  return ok(data, { page, limit, total });
});
