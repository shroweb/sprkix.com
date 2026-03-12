import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { eventId, rating, comment, userId } = body;

  const [review, event] = await Promise.all([
    prisma.review.create({ data: { rating, comment, userId, eventId } }),
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
          link: `/events/${event.slug}`,
        })),
        skipDuplicates: true,
      });
    }
  }

  return NextResponse.json(review);
}
