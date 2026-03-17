import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { requireAuth } from "@lib/v1/auth";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest, ctx: any) => {
  const user = await requireAuth(req);
  const { id } = await ctx.params;

  const existing = await prisma.reviewVote.findUnique({
    where: { userId_reviewId: { userId: user.id, reviewId: id } },
  });

  if (existing) {
    await prisma.reviewVote.delete({
      where: { userId_reviewId: { userId: user.id, reviewId: id } },
    });
  } else {
    await prisma.reviewVote.create({
      data: { userId: user.id, reviewId: id },
    });
  }

  const likeCount = await prisma.reviewVote.count({ where: { reviewId: id } });
  return ok({ liked: !existing, likeCount });
});
