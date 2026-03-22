import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromBearer } from "@lib/v1/auth";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
  const currentUser = await getUserFromBearer(req);

  const users = await prisma.user.findMany({
    where: { isSuspended: false },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      favoritePromotion: true,
      predictionScore: true,
      _count: { select: { reviews: true, matchRatings: true } },
    },
  });

  const scored = users
    .map((u) => ({
      id: u.id,
      name: u.name!,
      slug: u.slug!,
      avatarUrl: u.avatarUrl,
      favoritePromotion: u.favoritePromotion,
      reviewCount: u._count.reviews,
      ratingCount: u._count.matchRatings,
      predictionScore: u.predictionScore,
      score: u._count.reviews * 3 + u.predictionScore + u._count.matchRatings,
      isMe: currentUser ? u.id === currentUser.id : false,
    }))
    .filter((u) => u.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return ok(scored, { total: scored.length });
});
