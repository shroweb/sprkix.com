import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
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

  // Notify watchlist holders (excluding the reviewer)
  if (event) {
    const watchers = await prisma.watchListItem.findMany({
      where: { eventId, userId: { not: userId } },
      select: { userId: true },
    });
    if (watchers.length > 0) {
      const eventTitle = event.title.replace(/–\s\d{4}.*$/, "").trim();
      await (prisma as any).notification.createMany({
        data: watchers.map((w: any) => ({
          userId: w.userId,
          type: "review",
          message: `New review posted for ${eventTitle}`,
          link: `/events/${event.slug}/reviews/popular?reviewId=${review.id}#review-${review.id}`,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(review);
}
