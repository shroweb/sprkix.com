import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import { getUserFromServerCookie } from "@lib/server-auth";
import ReviewCard from "@components/ReviewCard";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function PopularReviewsPage(props: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string; reviewId?: string }>;
}) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const reviewId = searchParams.reviewId;

  const pageParam = searchParams?.page;
  let page = 1;
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10);
    if (!isNaN(parsedPage) && parsedPage > 0) {
      page = parsedPage;
    }
  }

  const event = await prisma.event.findUnique({
    where: { slug },
    select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true },
  });

  if (!event) return notFound();

  const isUpcoming = new Date(event.date) > new Date();

  const skip = (page - 1) * 5;

  let reviews = await prisma.review.findMany({
    where: { eventId: event.id },
    include: {
      user: true,
      Reply: { include: { user: true } },
      _count: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: 5,
  });

  // If we have a reviewId and it's not in the current page, we should ideally fetch it.
  // For simplicity, if it's not and we're on page 1, let's try to ensure it's there.
  if (reviewId && page === 1) {
    const isFound = reviews.some(r => r.id === reviewId);
    if (!isFound) {
      const targetReview = await prisma.review.findUnique({
        where: { id: reviewId },
        include: {
          user: true,
          Reply: { include: { user: true } },
          _count: true,
        }
      });
      if (targetReview && targetReview.eventId === event.id) {
        reviews = [targetReview, ...reviews.slice(0, 4)];
      }
    } else {
      // Prioritize it at the top
      const idx = reviews.findIndex(r => r.id === reviewId);
      const [highlighted] = reviews.splice(idx, 1);
      reviews = [highlighted, ...reviews];
    }
  }

  const user = await getUserFromServerCookie();

  // Pagination logic
  const totalPages = Math.ceil(
    (await prisma.review.count({ where: { eventId: event.id } })) / 5,
  );

  const Pagination = () => (
    <div className="flex justify-center items-center gap-4 mt-8">
      <a
        href={`?page=${Math.max(1, page - 1)}`}
        className={`px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-colors ${page === 1 ? "opacity-50 pointer-events-none" : ""}`}
      >
        Previous
      </a>
      <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        Page {page} of {totalPages} {isUpcoming ? "comments" : "reviews"}
      </span>
      <a
        href={`?page=${Math.min(totalPages, page + 1)}`}
        className={`px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-bold uppercase tracking-widest hover:bg-primary hover:text-black transition-colors ${page === totalPages ? "opacity-50 pointer-events-none" : ""}`}
      >
        Next
      </a>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <Link
        href={`/events/${event.slug}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group mb-8"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Event
      </Link>
      <div className="w-full flex gap-6 items-start mb-6">
        <img
          src={event.posterUrl || "/placeholder.png"}
          alt={event.title}
          width={120}
          height={180}
          className="rounded shadow"
        />
        <div>
          <h1 className="text-3xl font-bold">
            {event.title.replace(/–\s\d{4}-\d{2}-\d{2}$/, "")}
          </h1>
          <p className="text-sm text-gray-500 mb-1">
            {isUpcoming ? "Comments" : "Reviews"}
          </p>
        </div>
      </div>
      <div className="w-full space-y-6">
        {reviews.length > 0 ? (
          reviews.map((review: any) => (
            <ReviewCard 
              key={review.id} 
              review={review} 
              user={user} 
              highlighted={review.id === reviewId}
              event={{
                title: event.title,
                posterUrl: event.posterUrl,
                promotion: event.promotion
              }}
            />
          ))
        ) : (
          <p className="text-muted-foreground italic text-center p-12 bg-secondary/20 rounded-[2rem]">
            No {isUpcoming ? "comments" : "reviews"} yet.
          </p>
        )}
      </div>
      <Pagination />
    </div>
  );
}
