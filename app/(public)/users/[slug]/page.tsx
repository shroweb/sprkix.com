import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Star, Users, UserCheck, ChevronLeft, Heart, CheckCircle, Trophy, Activity, Calendar, Award, Target } from "lucide-react";
import FollowButton from "@components/FollowButton";
import ProfileThemeWrapper from "@components/ProfileThemeWrapper";
import RankBadge, { getRank } from "@components/RankBadge";
import FollowListModal from "@components/FollowListModal";
import VisualRating from "@components/VisualRating";

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
        },
        predictions: {
          // Fetch predictions on matches that have a declared winner (isCorrect may be null if
          // results were saved without going through the resolution endpoint)
          where: {
            predictedWinnerId: { not: null },
            match: { participants: { some: { isWinner: true } } },
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
          include: {
            match: {
              include: {
                event: { select: { slug: true, title: true, posterUrl: true, promotion: true, date: true } },
                participants: { include: { wrestler: true } },
              },
            },
          },
        },
        profileThemeEvent: true,
        MatchRating: true,
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
      ).toFixed(2)
    : null;

  const isOwnProfile = currentUser?.id === profileUser.id;
  
  // Calculate Completionist Stat
  const ratingsByEvent: Record<string, number> = {};
  profileUser.MatchRating.forEach((r: any) => {
    // We don't have eventId directly in MatchRating, let's include it in the query
  });
  
  // Revised query approach for performance
  const userMatchRatings = await prisma.matchRating.findMany({
    where: { userId: profileUser.id },
    include: { match: { select: { eventId: true } } }
  });

  const eventRatingCounts: Record<string, number> = {};
  userMatchRatings.forEach(r => {
    eventRatingCounts[r.match.eventId] = (eventRatingCounts[r.match.eventId] || 0) + 1;
  });

  const eventsRated = await prisma.event.findMany({
    where: { id: { in: Object.keys(eventRatingCounts) } },
    include: { _count: { select: { matches: true } } }
  });

  const cardsCompleted = eventsRated.filter(e => 
    e._count.matches > 0 && eventRatingCounts[e.id] >= e._count.matches
  ).length;

  // Prediction accuracy stats — computed live from raw data so they're always accurate
  // even when the denormalized predictionScore / predictionCount fields are stale.
  const allUserPredictions = await prisma.prediction.findMany({
    where: {
      userId: profileUser.id,
      predictedWinnerId: { not: null },
      match: { participants: { some: { isWinner: true } } },
    },
    select: {
      predictedWinnerId: true,
      isCorrect: true,
      match: {
        select: {
          participants: {
            where: { isWinner: true },
            select: { wrestlerId: true },
          },
        },
      },
    },
  });

  let predictionScore = 0;
  const predictionCount = allUserPredictions.length;
  for (const p of allUserPredictions) {
    const isCorrect =
      p.isCorrect !== null
        ? p.isCorrect
        : p.match.participants.some((mp) => mp.wrestlerId === p.predictedWinnerId);
    if (isCorrect) predictionScore++;
  }
  const predictionAccuracy =
    predictionCount > 0 ? Math.round((predictionScore / predictionCount) * 100) : null;

  // Calculate member since
  const memberSince = new Date(profileUser.createdAt).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const totalActivity = profileUser.reviews.length + (profileUser.MatchRating?.length || 0);
  const userRank = getRank(totalActivity);

  return (
    <div className="pb-20 relative px-6">
      <ProfileThemeWrapper posterUrl={profileUser.profileThemeEvent?.posterUrl ?? undefined} />

      {/* Hero Section / Cover Image */}
      <div className="relative h-[500px] w-full mt-8 overflow-hidden rounded-[4rem] border border-white/5 shadow-2xl">
         {/* Cover Photo */}
         {profileUser.profileThemeEvent?.posterUrl && (
           <div className="absolute inset-0 -z-10">
             <Image 
               src={profileUser.profileThemeEvent.posterUrl} 
               fill 
               className="object-cover saturate-[0.8] brightness-[0.5] scale-110 blur-[2px]" 
               alt="" 
             />
           </div>
         )}
         {/* Gradient Overlay */}
         <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
         
         <div className="max-w-6xl mx-auto px-6 h-full relative z-20 flex flex-col justify-end pb-16">
            <Link
              href="/events"
              className="absolute top-12 left-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Events
            </Link>

            <div className="flex flex-col md:flex-row items-end gap-10">
               {/* Avatar Area */}
                <div className="relative group/avatar">
                  <div 
                    className="w-48 h-48 rounded-full bg-primary flex items-center justify-center text-8xl font-black text-black shrink-0 shadow-2xl relative z-10 border-8 border-background overflow-hidden"
                    style={{ 
                      backgroundColor: 'var(--profile-theme-color, var(--primary))',
                      boxShadow: '0 25px 60px -12px rgba(var(--profile-theme-color-rgb), 0.6)'
                    }}
                  >
                    {profileUser.avatarUrl ? (
                      <Image src={profileUser.avatarUrl} fill className="object-cover" alt={profileUser.name || "Avatar"} />
                    ) : (
                      profileUser.name ? profileUser.name.charAt(0).toUpperCase() : "U"
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1 space-y-6 pb-6">
                   <div className="flex flex-col md:flex-row md:items-center gap-4">
                     <h1 className="text-7xl font-black italic uppercase tracking-tighter flex items-center gap-4 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                       {profileUser.name}
                       {(profileUser as any).isVerified && (
                         <CheckCircle className="w-12 h-12 text-blue-400 fill-blue-400/10" />
                       )}
                     </h1>
                   </div>
                  <div className="flex flex-wrap items-center gap-8">
                    <p className={`font-black italic text-2xl tracking-tight uppercase ${userRank.color}`}>
                       {userRank.name}
                    </p>
                    <div className="h-4 w-[1px] bg-white/20 hidden md:block" />
                    
                    {isOwnProfile ? (
                      <Link
                        href="/profile"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white transition-all backdrop-blur-xl"
                      >
                         Edit My Profile
                      </Link>
                    ) : currentUser ? (
                      <div className="scale-110 origin-left">
                        <FollowButton
                          targetUserId={profileUser.id}
                          initialIsFollowing={!!isFollowing}
                        />
                      </div>
                    ) : (
                      <Link
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-all"
                      >
                        Login to Follow
                      </Link>
                    )}
                  </div>

               {/* Stats Summary Panel */}
               <div className="hidden lg:flex gap-12 pb-6 border-l border-white/10 pl-12 h-fit mb-4">
                 <div className="space-y-1">
                    <span className="text-4xl font-black italic text-primary block leading-none" style={{ color: 'var(--profile-theme-color, var(--primary))' }}>
                      {avgRating || "—"}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Mean Rating</span>
                 </div>
                 <div className="space-y-1">
                    <span className="text-4xl font-black italic text-white block leading-none">
                      {profileUser.reviews.length}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Reviews</span>
                 </div>
                  <div className="space-y-1">
                     <span className="text-4xl font-black italic text-sky-400 block leading-none">
                       {cardsCompleted}
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Cards Completed</span>
                  </div>
                  {predictionAccuracy !== null && (
                    <div className="space-y-1">
                      <span className="text-4xl font-black italic text-emerald-400 block leading-none">
                        {predictionAccuracy}%
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Prediction Acc.</span>
                    </div>
                  )}
                </div>
             </div>
          </div>
       </div>
    </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-6 space-y-20 mt-12">
        
        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 -mt-20 relative z-30">
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Joined</p>
              <p className="text-sm font-black italic">{memberSince}</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Fav Promotion</p>
              <p className="text-sm font-black italic truncate">{(profileUser as any).favoritePromotion ?? "—"}</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex items-center gap-6 group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Predictions</p>
              {predictionCount > 0 ? (
                <p className="text-sm font-black italic">
                  {predictionScore}/{predictionCount}
                  <span className="text-emerald-400 ml-2">{predictionAccuracy}%</span>
                </p>
              ) : (
                <p className="text-sm font-black italic text-muted-foreground/50">None yet</p>
              )}
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[2rem] p-6 flex flex-row items-center justify-around">
              <FollowListModal
                userId={profileUser.id}
                type="followers"
                count={followersCount}
                label="Followers"
              />
              <div className="w-[1px] h-8 bg-white/5" />
              <FollowListModal
                userId={profileUser.id}
                type="following"
                count={followingCount}
                label="Following"
              />
          </div>
        </div>

        {/* Favorite Matches Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-6">
            <div className="px-5 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-red-500">
                Favorite Matches
              </h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-red-500/20 to-transparent" />
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                {profileUser.favoriteMatches?.length || 0} Saved
              </span>
              {profileUser.favoriteMatches && profileUser.favoriteMatches.length > 6 && (
                <Link
                  href={`/users/${profileUser.slug}/favorites`}
                  className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 underline underline-offset-4 decoration-2"
                >
                  See All
                </Link>
              )}
            </div>
          </div>

          {profileUser.favoriteMatches && profileUser.favoriteMatches.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {profileUser.favoriteMatches.slice(0, 6).map((fav: any) => (
                <Link
                  key={fav.match.id}
                  href={`/events/${fav.match.event.slug}`}
                  className="bg-card/40 border border-white/5 rounded-[2rem] p-6 hover:bg-card/60 hover:border-red-500/20 transition-all group relative overflow-hidden flex flex-col justify-between"
                >
                  <div className="absolute top-0 right-0 p-4">
                    <Heart className="w-5 h-5 text-red-500 fill-current opacity-40 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                        {fav.match.event.promotion}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black text-white/40 italic">
                        {new Date(fav.match.event.date).getFullYear()}
                      </span>
                    </div>
                    <h3 className="font-black text-lg uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 pr-6">
                      {fav.match.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      {fav.match.participants.slice(0, 3).map((p: any, i: number) => (
                        <span key={i} className="flex items-center gap-2">
                          {i > 0 && <span className="text-[10px] text-white/20">&amp;</span>}
                          <span className="text-xs font-bold text-white/60 group-hover:text-white transition-colors">{p.wrestler.name}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card/20 border border-dashed border-white/5 rounded-[3rem] p-20 text-center">
              <Heart className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/40 font-bold italic text-lg uppercase tracking-tighter">
                No favorite matches saved yet.
              </p>
            </div>
          )}
        </section>

        {/* Predictions Section */}
        {predictionCount > 0 && (
          <section className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="px-5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-emerald-400">
                  Predictions
                </h2>
              </div>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-emerald-500/20 to-transparent" />
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                  {predictionScore}/{predictionCount} correct · {predictionAccuracy}% accuracy
                </span>
              </div>
            </div>

            {(profileUser as any).predictions?.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {(profileUser as any).predictions.map((pred: any) => {
                  // Compute isCorrect on-the-fly if not stored
                  const winnerIds = new Set(
                    pred.match.participants
                      .filter((p: any) => p.isWinner)
                      .map((p: any) => p.wrestler.id),
                  );
                  const isCorrect =
                    pred.isCorrect !== null
                      ? pred.isCorrect
                      : pred.predictedWinnerId
                      ? winnerIds.has(pred.predictedWinnerId)
                      : false;

                  const names = pred.match.participants
                    .map((p: any) => p.wrestler.name)
                    .join(" vs ");
                  const predictedWrestler = pred.match.participants.find(
                    (p: any) => p.wrestler.id === pred.predictedWinnerId
                  )?.wrestler;
                  return (
                    <Link
                      key={pred.id}
                      href={`/events/${pred.match.event.slug}`}
                      className={`flex gap-5 items-center rounded-[2rem] p-5 border transition-all group ${
                        isCorrect
                          ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                          : "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                        isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
                      }`}>
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-lg font-black">✗</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-0.5">
                          {pred.match.event.promotion} · {new Date(pred.match.event.date).getFullYear()}
                        </p>
                        <p className="text-sm font-black italic uppercase tracking-tight text-white/80 group-hover:text-white transition-colors truncate">
                          {names}
                        </p>
                        {predictedWrestler && (
                          <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                            Picked: <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>{predictedWrestler.name}</span>
                          </p>
                        )}
                      </div>
                      <div className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
                        isCorrect ? "text-emerald-400" : "text-red-400/70"
                      }`}>
                        {isCorrect ? "Correct ✓" : "Wrong"}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </section>
        )}

        {/* Reviews Section */}
        <section className="space-y-8">
           <div className="flex items-center gap-6">
            <div className="px-5 py-2 bg-primary/10 border border-primary/20 rounded-xl">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
                Reviews
              </h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/20 to-transparent" />
            <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                 {profileUser.reviews.length} Written
               </span>
            </div>
          </div>

          {profileUser.reviews.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {profileUser.reviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/events/${review.event.slug}`}
                  className="flex gap-6 items-center bg-card/40 border border-white/5 rounded-[2.5rem] p-6 hover:bg-card/60 hover:border-primary/20 transition-all group backdrop-blur-sm"
                >
                  <div className="relative w-16 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 border border-white/5 shadow-xl">
                    <Image
                      src={review.event.posterUrl || "/placeholder.png"}
                      alt={review.event.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-black text-xl uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-1">
                          {review.event.title.replace(/–\s\d{4}.*$/, "")}
                        </h3>
                        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.1em] mt-1">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex text-primary px-3 py-1.5 bg-primary/5 border border-primary/10 rounded-full h-fit">
                        <VisualRating rating={review.rating} size="xs" />
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-lg text-white/60 font-medium italic line-clamp-2 leading-relaxed">
                        &ldquo;{review.comment}&rdquo;
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card/20 border border-dashed border-white/5 rounded-[3rem] p-20 text-center">
              <Star className="w-12 h-12 text-white/5 mx-auto mb-4" />
              <p className="text-white/40 font-bold italic text-lg uppercase tracking-tighter">
                No reviews posted yet.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
