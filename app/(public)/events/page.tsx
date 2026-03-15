import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";
import EventsGrid from "./EventsGrid";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ promotion?: string }>;
}) {
  const { promotion: initialPromotion } = await searchParams;
  const user = await getUserFromServerCookie();

  const [raw, userReviews] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true, title: true, slug: true, date: true, promotion: true,
        venue: true, posterUrl: true, description: true, type: true,
        startTime: true, endTime: true, createdAt: true,
        reviews: { select: { rating: true } },
      },
    }),
    user
      ? prisma.review.findMany({
          where: { userId: user.id },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const reviewedEventIds = (userReviews as { eventId: string }[]).map(
    (r) => r.eventId,
  );

  const events = raw.map((e: any) => ({
    id: e.id,
    title: e.title,
    slug: e.slug,
    date: e.date,
    promotion: e.promotion,
    posterUrl: e.posterUrl,
    startTime: e.startTime,
    endTime: e.endTime,
    avgRating: e.reviews.length
      ? e.reviews.reduce((s: number, r: any) => s + r.rating, 0) / e.reviews.length
      : 0,
    reviewCount: e.reviews.length,
  }));

  return (
    <div className="rounded-t-lg text-white overflow-hidden">
      <EventsGrid
        events={events}
        initialPromotion={initialPromotion}
        reviewedEventIds={reviewedEventIds}
      />
    </div>
  );
}
