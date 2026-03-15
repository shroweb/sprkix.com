import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest, ctx: any) => {
  const user = await requireAuth(req);
  const { id: matchId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { rating } = body;

  if (!rating || typeof rating !== "number" || rating < 0.25 || rating > 5) {
    return err("rating must be a number between 0.25 and 5");
  }

  const match = await prisma.match.findUnique({ where: { id: matchId }, select: { id: true } });
  if (!match) return err("Match not found", 404);

  await prisma.matchRating.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { rating },
    create: { userId: user.id, matchId, rating },
  });

  // Recalculate average
  const agg = await prisma.matchRating.aggregate({
    where: { matchId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const average = Math.round((agg._avg.rating ?? 0) * 100) / 100;

  await prisma.match.update({ where: { id: matchId }, data: { rating: average } });

  return ok({ average, ratingCount: agg._count.rating });
});
