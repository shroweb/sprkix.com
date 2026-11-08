import type { Metadata } from "next";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { getEventList } from "@lib/cached-data";
import { getSiteUrl } from "@lib/seo";
import EventsGrid from "./EventsGrid";

// Filters live in the query string (?promotion=…); every variant canonicalises to /events.
export const metadata: Metadata = {
  title: "Pro Wrestling Events – Ratings & Reviews | Poison Rana",
  description:
    "Browse every pro wrestling event with community ratings, reviews and match results. Filter by promotion, year and more.",
  alternates: { canonical: `${getSiteUrl()}/events` },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ promotion?: string }>;
}) {
  const { promotion: initialPromotion } = await searchParams;
  const user = await getUserFromServerCookie();

  const [events, userReviews] = await Promise.all([
    getEventList(),
    user
      ? prisma.review.findMany({
          where: { userId: user.id },
          select: { eventId: true },
        })
      : Promise.resolve([]),
  ]);

  const reviewedEventIds = userReviews.map((r) => r.eventId);

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
