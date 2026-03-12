import Link from "next/link";
import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPosterColors } from "@lib/poster-color";
import ReviewForm from "@components/ReviewForm";
import WatchListButton from "@components/WatchListButton";
import ReplyForm from "@components/ReplyForm";
import { getUserFromServerCookie } from "@lib/server-auth";
import MatchList from "@components/MatchList";
import ShareButton from "@components/ShareButton";
import ReviewUpvote from "@components/ReviewUpvote";
import { Calendar, Clock, Star, ChevronLeft, Info, Trophy, MapPin, Share2 } from "lucide-react";
import ShareReviewButton from "@components/ShareReviewButton";

export default async function EventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      matches: {
        include: {
          participants: {
            include: { wrestler: true },
          },
          ratings: {
            select: {
              rating: true,
              userId: true,
            },
          },
        },
      },
      reviews: {
        include: {
          user: true,
          Reply: {
            include: { user: true },
            orderBy: { createdAt: "asc" },
          },
          votes: { select: { userId: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!event) return notFound();

  const user = await getUserFromServerCookie();
  const userId = user?.id;

  const processedMatches = event.matches.map((match) => {
    const userRating =
      match.ratings.find((r) => r.userId === userId)?.rating || 0;
    const averageRating = match.ratings.length
      ? match.ratings.reduce((sum, r) => sum + r.rating, 0) /
        match.ratings.length
      : 0;

    return { ...match, userRating, averageRating };
  });

  const isUpcoming = new Date(event.date) > new Date();

  const averageRating = event.reviews.length
    ? parseFloat(
        (
          event.reviews.reduce((a: number, b: any) => a + b.rating, 0) /
          event.reviews.length
        ).toFixed(2),
      )
    : null;

  const inWatchList = user
    ? await prisma.watchListItem.findFirst({
        where: { userId: user.id, eventId: event.id },
      })
    : null;

  // Ranking logic
  const allEventsWithRatings = await prisma.event.findMany({
    include: { reviews: { select: { rating: true } } },
  });

  const allRatings = allEventsWithRatings.flatMap((e) =>
    e.reviews.map((r: any) => r.rating),
  );
  const globalAverage = allRatings.length
    ? allRatings.reduce((a: number, b: number) => a + b, 0) / allRatings.length
    : 0;
  const minReviews = 10;

  const topRated = allEventsWithRatings
    .map((e) => {
      const rats = e.reviews.map((r: any) => r.rating);
      const R =
        rats.reduce((a: number, b: number) => a + b, 0) / (rats.length || 1);
      const v = rats.length;
      const m = minReviews;
      const C = globalAverage;
      const weightedRating = (v / (v + m)) * R + (m / (v + m)) * C;
      return { id: e.id, weightedRating };
    })
    .sort((a, b) => b.weightedRating - a.weightedRating)
    .slice(0, 10);

  const eventRank = topRated.findIndex((e) => e.id === event.id);

  // duration is stored in seconds
  const totalMatchDuration = processedMatches.reduce(
    (sum, m) => sum + (m.duration || 0),
    0,
  );
  const topMatch =
    processedMatches.length > 0
      ? processedMatches.reduce(
          (best, m) => (m.averageRating > best.averageRating ? m : best),
          processedMatches[0],
        )
      : null;
  const durationHours = Math.floor(totalMatchDuration / 3600);
  const durationMins = Math.floor((totalMatchDuration % 3600) / 60);
  const durationSecs = totalMatchDuration % 60;
  const durationStr =
    totalMatchDuration > 0
      ? durationHours > 0
        ? `${durationHours}h ${durationMins}m`
        : `${durationMins}m ${durationSecs}s`
      : null;

  // "You Might Also Like" — same promotion, scored by weighted rating
  const relatedEvents = allEventsWithRatings
    .filter((e) => e.id !== event.id && e.promotion === event.promotion)
    .map((e) => {
      const rats = e.reviews.map((r: any) => r.rating);
      const R = rats.length
        ? rats.reduce((a: number, b: number) => a + b, 0) / rats.length
        : 0;
      const v = rats.length;
      const score =
        (v / (v + minReviews)) * R +
        (minReviews / (v + minReviews)) * globalAverage;
      return { ...e, score, avgRating: R, reviewCount: v };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  const [c1, c2, c3] = await getPosterColors(event.posterUrl);

  return (
    <div className="min-h-screen pb-20">
      {/* Poster colour gradient backdrop */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 15% 10%, rgba(${c1},0.55) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 85% 20%, rgba(${c2},0.35) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 50% 100%, rgba(${c3},0.25) 0%, transparent 70%)
          `,
        }}
      />
      <div className="fixed inset-0 z-0 bg-background/80" />

      <div className="max-w-7xl mx-auto px-6 pt-10 relative z-10">
        {/* Back Link */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to All Events
        </Link>

        {/* Mobile-first Title & Metadata Header */}
        <div className="space-y-6 mb-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3">
                <div className="h-[1px] w-8 bg-primary"></div>
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
                  Live Event Details
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9] break-words hyphens-auto">
                {event.title.replace(/–\s\d{4}-\d{2}-\d{2}$/, "")}
              </h1>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {event.venue ? (
                    <>
                      <MapPin className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        {event.venue}
                      </span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-primary" />
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
                        Archive Record
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[320px_1fr] gap-10 items-start">
          {/* Left Column: Poster & Quick Info */}
          <div className="space-y-6 lg:sticky lg:top-28">
            <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 group max-w-[320px] mx-auto lg:mx-0">
              <Image
                src={event.posterUrl || "/placeholder.png"}
                alt={event.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              {eventRank !== -1 && (
                <div className="absolute top-4 left-4">
                  <div className="bg-yellow-400 text-black px-3 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-tighter flex items-center gap-1.5 shadow-xl">
                    <Trophy className="w-3 h-3 fill-current" />
                    Top 10 Rated (# {eventRank + 1})
                  </div>
                </div>
              )}
            </div>

            <div className="bg-card/50 backdrop-blur-md border border-border rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Promotion
                </span>
                <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase rounded-lg shadow-sm whitespace-nowrap">
                  {event.promotion}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Type
                </span>
                <span className="text-xs font-bold capitalize italic text-white/90 text-right">
                  {event.type || "Special Event"}
                </span>
              </div>
              <div className="flex justify-between items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground shrink-0">
                  Community
                </span>
                <div className="flex items-center gap-1.5 text-primary shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-sm font-black italic">
                    {averageRating?.toFixed(2) || "0.00"}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                {user && (
                    <WatchListButton
                        eventId={event.id}
                        isSavedInitial={!!inWatchList}
                    />
                )}
                <ShareButton />
              </div>
            </div>
          </div>

          {/* Right Column: Content */}
          <div className="space-y-12 pb-12">
            <div className="relative">
              <div className="hidden sm:block absolute top-0 left-0 w-1 h-full bg-primary/20 rounded-full"></div>
              <p className="sm:pl-6 text-lg sm:text-xl text-foreground font-medium italic leading-relaxed max-w-3xl">
                {event.description ||
                  "The curtains are drawn on this chapter of history. No description has been salvaged yet."}
              </p>
            </div>

            {/* At a Glance Dashboard */}
            {processedMatches.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {processedMatches.length}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                    Matches Card
                  </span>
                </div>
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg">
                  <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-foreground tracking-tighter">
                    {durationStr ?? "—"}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">
                    Card Duration
                  </span>
                </div>
                <div className="bg-card/40 border border-white/5 rounded-2xl md:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-1 text-center hover:bg-card/60 transition-colors shadow-lg col-span-2 md:col-span-1">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-5 h-5 text-primary fill-current" />
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black italic text-primary tracking-tighter">
                      {topMatch && topMatch.averageRating > 0
                        ? topMatch.averageRating.toFixed(1)
                        : "—"}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary/60 whitespace-nowrap">
                    Peak Performance
                  </span>
                </div>
              </div>
            )}

            {/* Match Card Section */}
            <section className="space-y-8">
              <div className="flex items-center gap-4">
                <h2 className="text-3xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                  The Match Card
                </h2>
                <div className="flex-1 h-[1px] bg-border"></div>
              </div>
              {processedMatches.length > 0 ? (
                <MatchList
                  matches={processedMatches as any}
                  user={user}
                  motNMatchId={
                    topMatch && topMatch.averageRating > 0
                      ? topMatch.id
                      : undefined
                  }
                />
              ) : (
                <div className="bg-card/30 border border-border border-dashed rounded-[2rem] p-20 text-center">
                  <Info className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-bold italic">
                    No matches have been logged for this event.
                  </p>
                </div>
              )}
            </section>

            {!isUpcoming && (
              <section className="space-y-12 pt-12">
                <div className="grid xl:grid-cols-2 gap-12">
                  {/* Review Form */}
                  <div className="space-y-6">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                      Review Event
                    </h2>
                    <div className="bg-card border border-border rounded-[2rem] p-8">
                      {user ? (
                        <ReviewForm event={event} user={user} />
                      ) : (
                        <div className="text-center py-6">
                          <p className="italic font-bold text-muted-foreground mb-4">
                            You must enter the arena to leave a review.
                          </p>
                          <Link
                            href="/login"
                            className="btn-primary inline-block"
                          >
                            Login Now
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Reviews List */}
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-3xl font-black uppercase italic tracking-tighter underline decoration-primary decoration-4 underline-offset-8">
                        Fan Reactions
                      </h2>
                      <Link
                        href={`/events/${event.slug}/reviews/popular`}
                        className="text-xs font-black uppercase text-primary hover:underline"
                      >
                        See All
                      </Link>
                    </div>
                    {event.reviews.length > 0 ? (
                      <div className="space-y-4">
                        {event.reviews.slice(0, 1).map((review) => (
                          <div
                            key={review.id}
                            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors relative group"
                          >
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black text-white">
                                  {review.user?.name
                                    ? review.user.name.charAt(0).toUpperCase()
                                    : "A"}
                                </div>
                                <span className="text-sm font-black italic">
                                  {review.user?.name || "Anonymous"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 text-primary">
                                <Star className="w-3.5 h-3.5 fill-current" />
                                <span className="text-sm font-black text-primary">
                                  {review.rating}
                                </span>
                              </div>
                              <ShareReviewButton
                                review={review}
                                event={{
                                  title: event.title,
                                  posterUrl: event.posterUrl,
                                  promotion: event.promotion
                                }}
                                className="opacity-0 group-hover:opacity-100 p-2 hover:bg-white/10 rounded-lg transition-all text-muted-foreground hover:text-primary active:scale-90"
                              />
                            </div>
                            <p className="text-sm text-foreground/80 font-medium italic leading-relaxed">
                              "{review.comment}"
                            </p>

                            {review.Reply && review.Reply.length > 0 && (
                              <div className="mt-4 pt-4 border-t border-border space-y-3">
                                {review.Reply.slice(0, 1).map((reply: any) => (
                                  <div
                                    key={reply.id}
                                    className="flex gap-3 text-xs bg-secondary/50 p-3 rounded-xl italic leading-snug"
                                  >
                                    <span className="font-black text-primary uppercase shrink-0">
                                      {reply.user?.name}
                                    </span>
                                    <span className="text-muted-foreground w-full break-words">
                                      {reply.comment}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-4">
                              <ReviewUpvote
                                reviewId={review.id}
                                initialCount={review.votes?.length || 0}
                                initialVoted={review.votes?.some(
                                  (v: any) => v.userId === userId,
                                )}
                                isLoggedIn={!!user}
                              />
                              <div className="w-full">
                                {user && <ReplyForm reviewId={review.id} />}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-muted-foreground font-medium p-12 text-center bg-secondary/20 rounded-[2rem]">
                        Silence from the crowd. No reviews yet.
                      </p>
                    )}
                  </div>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* You Might Also Like */}
        {relatedEvents.length > 0 && (
          <section className="pt-16 pb-4 relative z-10">
            <div>
              <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between gap-4 mb-10">
                <h2 className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter">
                  More from {event.promotion}
                </h2>
                <Link
                  href={`/events?promotion=${encodeURIComponent(event.promotion)}`}
                  className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline border border-primary/20 bg-primary/5 px-4 py-2 rounded-full"
                >
                  View All
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {relatedEvents.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/events/${rel.slug}`}
                    className="group"
                  >
                    <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/5">
                      <Image
                        src={rel.posterUrl || "/placeholder.png"}
                        alt={rel.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                      {rel.reviewCount > 0 && (
                        <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-primary fill-current" />
                          <span className="text-[10px] font-black text-white">
                            {rel.avgRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-black text-xs uppercase italic tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                      {rel.title.replace(/–\s\d{4}.*$/, "")}
                    </h3>
                    <p className="text-[10px] font-bold text-muted-foreground mt-1">
                      {new Date(rel.date).getFullYear()}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
