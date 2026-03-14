import { getUserFromServerCookie } from "@lib/server-auth";
import { prisma } from "@lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, Rss } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getUserFromServerCookie();
  if (!user) redirect("/login");

  const following = await prisma.follow.findMany({
    where: { followerId: user.id },
    select: { followingId: true },
  });

  const followingIds = following.map((f) => f.followingId);

  const reviews =
    followingIds.length > 0
      ? await prisma.review.findMany({
          where: { userId: { in: followingIds } },
          include: {
            user: {
              select: {
                id: true, name: true, slug: true, avatarUrl: true,
                isAdmin: true, isVerified: true, favoritePromotion: true,
                createdAt: true, predictionScore: true, predictionCount: true,
                profileThemeEventId: true,
              },
            },
            event: {
              select: {
                title: true,
                slug: true,
                posterUrl: true,
                promotion: true,
                date: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 40,
        })
      : [];

  // Time label helper
  const timeAgo = (date: Date | string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
            Social Feed
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase italic">
          Following
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Reviews from the {followingIds.length}{" "}
          {followingIds.length === 1 ? "person" : "people"} you follow.
        </p>
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Rss className="w-8 h-8 text-primary/40" />
          </div>
          <div className="space-y-2">
            <p className="font-black text-lg italic uppercase tracking-tighter">
              Your feed is empty
            </p>
            {followingIds.length === 0 ? (
              <>
                <p className="text-muted-foreground font-medium italic text-sm">
                  Follow other members to see their reviews here.
                </p>
                <Link
                  href="/events"
                  className="btn-primary inline-block mt-4 text-sm"
                >
                  Browse Events & Find Reviewers
                </Link>
              </>
            ) : (
              <p className="text-muted-foreground font-medium italic text-sm">
                The people you follow haven&apos;t posted any reviews yet.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="bg-card/40 border border-white/5 rounded-3xl p-6 hover:border-primary/20 transition-all group"
            >
              {/* User + time header */}
              <div className="flex items-center justify-between mb-5">
                <Link
                  href={`/users/${review.user.slug || review.user.id}`}
                  className="flex items-center gap-3 group/user"
                >
                  <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-black text-black group-hover/user:scale-110 transition-transform">
                    {review.user.name?.charAt(0).toUpperCase() ?? "U"}
                  </div>
                  <div>
                    <p className="text-sm font-black italic group-hover/user:text-primary transition-colors">
                      {review.user.name}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {timeAgo(review.createdAt)}
                    </p>
                  </div>
                </Link>

                {/* Star rating */}
                <div className="flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl">
                  <Star className="w-3.5 h-3.5 text-primary fill-current" />
                  <span className="text-sm font-black text-primary">
                    {review.rating}
                  </span>
                  <span className="text-[10px] font-bold text-primary/60">
                    / 5
                  </span>
                </div>
              </div>

              {/* Event info + review */}
              <Link
                href={`/events/${review.event.slug}`}
                className="flex gap-5 items-start"
              >
                <div className="relative w-16 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5 shadow-xl">
                  <Image
                    src={review.event.posterUrl || "/placeholder.png"}
                    alt={review.event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-3">
                  <div>
                    <span className="inline-block px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase rounded mb-2">
                      {review.event.promotion}
                    </span>
                    <h2 className="font-black text-base uppercase italic tracking-tighter leading-tight group-hover:text-primary transition-colors">
                      {review.event.title.replace(/–\s\d{4}.*$/, "")}
                    </h2>
                    <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                      {new Date(review.event.date).getFullYear()}
                    </p>
                  </div>

                  {/* Star row */}
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating ? "fill-current text-primary" : "text-muted-foreground/20"}`}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-sm text-foreground/70 font-medium italic leading-relaxed line-clamp-3">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}

      {/* Discover section when few results */}
      {reviews.length > 0 && reviews.length < 10 && (
        <div className="border-t border-border pt-8 text-center space-y-3">
          <Users className="w-8 h-8 text-muted-foreground/20 mx-auto" />
          <p className="text-sm text-muted-foreground font-medium italic">
            Follow more members to grow your feed.
          </p>
          <Link href="/events" className="btn-primary inline-block text-sm">
            Discover Events & Reviewers
          </Link>
        </div>
      )}
    </div>
  );
}
