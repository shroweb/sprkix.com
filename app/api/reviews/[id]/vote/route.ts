import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";
import { sendPushToUser } from "../../../../../lib/push";

// POST /api/reviews/[id]/vote — toggle upvote
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id: reviewId } = await params;

  const existing = await prisma.reviewVote.findUnique({
    where: { userId_reviewId: { userId: user.id, reviewId } },
  });

  if (existing) {
    await prisma.reviewVote.delete({ where: { id: existing.id } });
    const count = await prisma.reviewVote.count({ where: { reviewId } });
    return NextResponse.json({ voted: false, count });
  } else {
    await prisma.reviewVote.create({ data: { userId: user.id, reviewId } });
    const count = await prisma.reviewVote.count({ where: { reviewId } });

    // Notify review author at milestones (not for your own vote)
    const MILESTONES = [1, 5, 10, 25, 50, 100];
    if (MILESTONES.includes(count)) {
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: {
          userId: true,
          event: { select: { title: true, slug: true } },
        },
      });
      if (review && review.userId !== user.id) {
        const eventTitle = review.event.title.replace(/–\s\d{4}.*$/, "").trim();
        await (prisma as any).notification.create({
          data: {
            userId: review.userId,
            type: "upvote",
            message: `Your review of ${eventTitle} hit ${count} ${count === 1 ? "upvote" : "upvotes"}`,
            link: `/events/${review.event.slug}`,
          },
        });
        await sendPushToUser(review.userId, {
          title: "Your review is getting love 🔥",
          body: `Your review of ${eventTitle} hit ${count} ${count === 1 ? "upvote" : "upvotes"}`,
          data: { path: `/events/${review.event.slug}` },
        });
      }
    }

    return NextResponse.json({ voted: true, count });
  }
}
