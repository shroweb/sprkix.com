import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, UserCheck, ChevronLeft, Heart } from "lucide-react";
import FollowButton from "@components/FollowButton";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [profileUser, currentUser] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [
          { slug },
          { id: slug }
        ]
      },
      include: {
        reviews: {
          orderBy: { createdAt: "desc" },
          include: { event: true },
        },
        favoriteMatches: {
          include: {
            match: {
              include: {
                event: true,
                participants: {
                  include: { wrestler: true }
                }
              }
            }
          }
        }
      },
    }),
    getUserFromServerCookie(),
  ]);

  if (!profileUser) return notFound();

  const [followersCount, followingCount, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { followingId: profileUser.id } }),
    prisma.follow.count({ where: { followerId: profileUser.id } }),
    currentUser
      ? prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: currentUser.id,
              followingId: profileUser.id,
            },
          },
        })
      : null,
  ]);

  const avgRating = profileUser.reviews.length
    ? (
        profileUser.reviews.reduce((sum, r) => sum + r.rating, 0) /
        profileUser.reviews.length
      ).toFixed(1)
    : null;

  const isOwnProfile = currentUser?.id === profileUser.id;

  return (
    <div className="space-y-16 pb-20 max-w-4xl mx-auto">
      {/* Back Link */}
      <Link
        href="/events"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Events
      </Link>

      {/* Profile Header */}
      <div className="bg-card/40 border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Avatar */}
        <div className="w-24 h-24 rounded-full shrink-0 shadow-2xl shadow-primary/30 overflow-hidden relative">
          {profileUser.avatarUrl ? (
            <Image
              src={profileUser.avatarUrl}
              alt={profileUser.name ?? "User"}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-primary flex items-center justify-center text-4xl font-black text-black">
              {profileUser.name
                ? profileUser.name.charAt(0).toUpperCase()
                : "U"}
            </div>
          )}
        </div>

        <div className="space-y-4 text-center md:text-left flex-1">
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">
              {profileUser.name}
            </h1>
            <p className="text-muted-foreground font-medium italic mt-1">
              Community Member
            </p>
          </div>

          {/* Stats Row */}
          <div className="flex flex-wrap justify-center md:justify-start gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-black">{followersCount}</span>
              <span className="text-sm text-muted-foreground font-medium">
                Followers
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary" />
              <span className="text-sm font-black">{followingCount}</span>
              <span className="text-sm text-muted-foreground font-medium">
                Following
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-primary fill-current" />
              <span className="text-sm font-black">
                {profileUser.reviews.length}
              </span>
              <span className="text-sm text-muted-foreground font-medium">
                Reviews
              </span>
              {avgRating && (
                <span className="text-xs font-black text-primary">
                  · avg {avgRating}
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          {isOwnProfile ? (
            <Link
              href="/profile"
              className="btn-primary inline-block text-sm px-5 py-2.5"
            >
              Edit My Profile
            </Link>
          ) : currentUser ? (
            <FollowButton
              targetUserId={profileUser.id}
              initialIsFollowing={!!isFollowing}
            />
          ) : (
            <Link
              href="/login"
              className="btn-primary inline-block text-sm px-5 py-2.5"
            >
              Login to Follow
            </Link>
          )}
        </div>
      </div>

      {/* Favorite Matches Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-red-500">
            Favorite Matches
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <div className="flex items-center gap-4">
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              {profileUser.favoriteMatches?.length || 0} Saved
            </span>
            {profileUser.favoriteMatches && profileUser.favoriteMatches.length > 6 && (
              <Link
                href={`/users/${profileUser.slug}/favorites`}
                className="text-xs font-black uppercase text-red-500 hover:underline"
              >
                See All
              </Link>
            )}
          </div>
        </div>

        {profileUser.favoriteMatches && profileUser.favoriteMatches.length > 0 ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {profileUser.favoriteMatches.slice(0, 6).map((fav: any) => (
              <Link
                key={fav.match.id}
                href={`/events/${fav.match.event.slug}`}
                className="bg-card/40 border border-white/5 rounded-2xl p-5 hover:bg-card/60 hover:border-red-500/20 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                      {fav.match.event.promotion}
                    </span>
                    <span className="text-[10px] font-black text-muted-foreground italic">
                      {new Date(fav.match.event.date).getFullYear()}
                    </span>
                  </div>
                  <h3 className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 pr-6">
                    {fav.match.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    {fav.match.participants.slice(0, 3).map((p: any, i: number) => (
                      <span key={i} className="flex items-center gap-1.5">
                        {i > 0 && <span className="text-[10px] text-muted-foreground">&amp;</span>}
                        <span className="text-xs font-bold">{p.wrestler.name}</span>
                      </span>
                    ))}
                    {fav.match.participants.length > 3 && (
                      <span className="text-xs text-muted-foreground">...</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
            <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">
              No favorite matches saved yet.
            </p>
          </div>
        )}
      </section>

      {/* Reviews Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            Reviews
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {profileUser.reviews.length} Written
          </span>
        </div>

        {profileUser.reviews.length > 0 ? (
          <div className="space-y-4">
            {profileUser.reviews.map((review) => (
              <Link
                key={review.id}
                href={`/events/${review.event.slug}`}
                className="flex gap-5 items-center bg-card/40 border border-white/5 rounded-2xl p-5 hover:bg-card/60 hover:border-primary/20 transition-all group"
              >
                <div className="relative w-14 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <Image
                    src={review.event.posterUrl || "/placeholder.png"}
                    alt={review.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="font-black text-sm uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2">
                      {review.event.title.replace(/–\s\d{4}.*$/, "")}
                    </h3>
                    <span className="text-[10px] font-black text-muted-foreground shrink-0">
                      {new Date(review.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex text-primary gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-muted-foreground/30"}`}
                      />
                    ))}
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground/60 font-medium italic line-clamp-2">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-muted-foreground/30 group-hover:text-primary/40 transition-colors shrink-0">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
            <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">
              No reviews posted yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
