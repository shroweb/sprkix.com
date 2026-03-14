import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || PAGE_SIZE)));

  // Get IDs of users this user follows
  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { userId: { in: followingIds } } }),
    prisma.review.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        event: {
          select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true },
        },
      },
    }),
  ]);

  return ok(reviews, { page, limit, total });
});
