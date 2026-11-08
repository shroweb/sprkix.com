import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { invalidateCache } from "@lib/cached-data";
import { notifyNewReview } from "@lib/discord";
import { getUserFromServerCookie } from "../../../lib/server-auth";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { eventId, rating, comment } = body;
  // userId always comes from the verified session — never trusted from the client
  const userId = user.id;

  // Only announce first-time reviews, not edits
  const previous = await prisma.review.findUnique({
    where: { userId_eventId: { userId, eventId } },
    select: { id: true },
  });

  const [review, event] = await Promise.all([
    prisma.review.upsert({
      where: {
        userId_eventId: { userId, eventId }
      },
      update: { rating, comment },
      create: { rating, comment, userId, eventId }
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, slug: true },
    }),
  ]);

  invalidateCache("reviews");
  if (!previous && event) {
    await notifyNewReview({
      userName: user.name ?? null,
      userSlug: user.slug,
      eventTitle: event.title,
      eventSlug: event.slug,
      rating: typeof rating === "number" ? rating : null,
      comment: comment ?? null,
    });
  }
  return NextResponse.json(review);
}
