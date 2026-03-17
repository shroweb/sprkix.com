import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (_req: NextRequest, ctx: any) => {
  const { slug } = await ctx.params;

  const user = await prisma.user.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      avatarUrl: true,
      favoritePromotion: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          WatchListItem: true,
          followers: true,
          following: true,
        },
      },
      reviews: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              date: true,
              promotion: true,
              posterUrl: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return Response.json({ data: null, error: "Not found" }, { status: 404 });
  }

  return ok({
    id: user.id,
    name: user.name,
    slug: user.slug,
    avatarUrl: user.avatarUrl,
    favoritePromotion: user.favoritePromotion,
    createdAt: user.createdAt,
    reviewCount: user._count.reviews,
    watchlistCount: user._count.WatchListItem,
    followersCount: user._count.followers,
    followingCount: user._count.following,
    reviews: user.reviews,
  });
});
