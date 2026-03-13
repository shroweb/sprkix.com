import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { reviewId, comment } = await req.json();

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    include: { event: { select: { title: true, slug: true } } },
  });

  const reply = await prisma.reply.create({
    data: {
      comment,
      userId: user.id,
      reviewId,
    },
  });

  // Create notification for the review owner
  if (review && review.userId !== user.id) {
    await (prisma as any).notification.create({
      data: {
        userId: review.userId,
        type: "reply",
        message: `${user.name} replied to your review of ${review.event.title.replace(/–\s\d{4}.*$/, "").trim()}`,
        detail: comment,
        link: `/events/${review.event.slug}/reviews/popular?reviewId=${reviewId}#review-${reviewId}`,
      },
    });
  }

  return NextResponse.json(reply);
}
