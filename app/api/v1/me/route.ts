import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const full = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      avatarUrl: true,
      isAdmin: true,
      isVerified: true,
      favoritePromotion: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          MatchRating: true,
          followers: true,
          following: true,
          WatchListItem: true,
        },
      },
    },
  });

  if (!full) return err("User not found", 404);

  const { _count, ...rest } = full;
  return ok({
    ...rest,
    reviewCount: _count.reviews,
    matchRatingCount: _count.MatchRating,
    followerCount: _count.followers,
    followingCount: _count.following,
    watchlistCount: _count.WatchListItem,
  });
});

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { name, avatarUrl, favoritePromotion } = body;

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(name ? { name: String(name).trim() } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl: avatarUrl ? String(avatarUrl) : null } : {}),
      ...(favoritePromotion !== undefined
        ? { favoritePromotion: favoritePromotion ? String(favoritePromotion) : null }
        : {}),
    },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      avatarUrl: true,
      favoritePromotion: true,
    },
  });

  return ok(updated);
});
