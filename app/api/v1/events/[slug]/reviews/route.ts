import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { requireAuth } from "@lib/v1/auth";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const PAGE_SIZE = 20;

export const GET = withErrorHandling(async (req: NextRequest, ctx: any) => {
  const { slug } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") || PAGE_SIZE)));

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!event) return err("Event not found", 404);

  const [total, reviews] = await Promise.all([
    prisma.review.count({ where: { eventId: event.id } }),
    prisma.review.findMany({
      where: { eventId: event.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        user: {
          select: { id: true, name: true, slug: true, avatarUrl: true },
        },
        Reply: {
          select: {
            id: true,
            comment: true,
            createdAt: true,
            user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  return ok(reviews, { page, limit, total });
});

export const POST = withErrorHandling(async (req: NextRequest, ctx: any) => {
  const user = await requireAuth(req);
  const { slug } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { rating, comment } = body;

  if (!rating || typeof rating !== "number" || rating < 0.5 || rating > 5) {
    return err("rating must be a number between 0.5 and 5");
  }

  const event = await prisma.event.findUnique({ where: { slug }, select: { id: true } });
  if (!event) return err("Event not found", 404);

  const review = await prisma.review.upsert({
    where: { userId_eventId: { userId: user.id, eventId: event.id } },
    update: { rating, comment: comment ? String(comment).trim() : null },
    create: { userId: user.id, eventId: event.id, rating, comment: comment ? String(comment).trim() : null },
    select: {
      id: true,
      rating: true,
      comment: true,
      createdAt: true,
      user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
    },
  });

  return ok(review, undefined, 201);
});
