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

  const [raw, ratingAgg, userReviews] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true, title: true, slug: true, date: true, promotion: true,
        venue: true, posterUrl: true, description: true, type: true,
        startTime: true, endTime: true, createdAt: true,
      },
    }),
    // Aggregate review stats once instead of loading every review row
    prisma.review.groupBy({
      by: ["eventId"],
      _avg: { rating: true },
      _count: { rating: true },
    }),
    user
      ? prisma.review.findMany({
          where: { userId: user.id },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const ratingByEvent = new Map(
    ratingAgg.map((r) => [r.eventId, r]),
  );
  const reviewedEventIds = (userReviews as { eventId: string }[]).map(
    (r) => r.eventId,
  );

  const events = raw.map((e: any) => {
    const agg = ratingByEvent.get(e.id);
    return {
      id: e.id,
      title: e.title,
      slug: e.slug,
      date: e.date,
      promotion: e.promotion,
      posterUrl: e.posterUrl,
      startTime: e.startTime,
      endTime: e.endTime,
      avgRating: agg?._count.rating ? (agg._avg.rating ?? 0) : 0,
      reviewCount: agg?._count.rating ?? 0,
    };
  });

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
