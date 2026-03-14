import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const promotion = searchParams.get("promotion");
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));

  const matches = await prisma.match.findMany({
    where: {
      rating: { not: null, gte: 1 },
      ...(promotion ? { event: { promotion: { equals: promotion, mode: "insensitive" } } } : {}),
    },
    orderBy: { rating: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      type: true,
      rating: true,
      duration: true,
      event: {
        select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true },
      },
      participants: {
        select: {
          id: true,
          team: true,
          isWinner: true,
          wrestler: { select: { id: true, name: true, slug: true, imageUrl: true } },
        },
      },
      _count: { select: { ratings: true } },
    },
  });

  const data = matches.map((m) => ({
    ...m,
    ratingCount: m._count.ratings,
    _count: undefined,
  }));

  return ok(data, { total: data.length });
});
