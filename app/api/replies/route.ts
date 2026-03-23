import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";
import { sendReplyEmail } from "../../../lib/mail";
import { sendPushToUser } from "../../../lib/push";

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

    // Push notification
    await sendPushToUser(review.userId, {
      title: `${user.name ?? "Someone"} replied to your review`,
      body: comment.length > 100 ? comment.slice(0, 97) + "…" : comment,
      data: { path: `/events/${review.event.slug}` },
    });

    // Also send an email
    try {
      const owner = await prisma.user.findUnique({ where: { id: review.userId } });
      if (owner && owner.emailNotifications !== false) {
        const link = `/events/${review.event.slug}/reviews/popular?reviewId=${reviewId}#review-${reviewId}`;
        const eventTitle = review.event.title.replace(/–\s\d{4}.*$/, "").trim();
        await sendReplyEmail(
          owner.email, 
          owner.name ?? "Wrestling Fan", 
          user.name ?? "Someone", 
          eventTitle, 
          comment, 
          link
        );
      }
    } catch (emailErr) {
      console.error("Email failed for reply:", emailErr);
    }
  }

  return NextResponse.json(reply);
}
