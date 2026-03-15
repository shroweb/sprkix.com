import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  BookMarked,
  Trophy,
  Calendar,
  Pencil,
  ChevronLeft,
  Award,
  Users,
  Activity,
  Heart,
  CheckCircle,
  List,
  Globe,
  Lock,
} from "lucide-react";
import ProfileReviews from "@components/ProfileReviews";
import FollowListModal from "@components/FollowListModal";
import { getRank } from "@lib/ranks";
import ProfileThemeWrapper from "@components/ProfileThemeWrapper";
import UsernameSetupModal from "@components/UsernameSetupModal";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const user = await getUserFromServerCookie();
  if (!user)
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground font-bold italic">
          You must be logged in to view your profile.
        </p>
        <Link href="/login" className="btn-primary inline-block mt-6">
          Login
        </Link>
      </div>
    );

  let currentUser: any = null;
  try {
    currentUser = await (prisma.user as any).findFirst({
      where: { id: user.id },
      include: { profileThemeEvent: true }
    });
  } catch (err) {
    console.error("Profile user fetch error:", err);
    currentUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
          id: true,
          name: true,
          email: true,
          slug: true,
          avatarUrl: true,
          isAdmin: true,
          isVerified: true,
          favoritePromotion: true,
          createdAt: true
      }
    });
  }

  const results = (await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: { select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
        Reply: {
          include: { user: { select: { id: true, name: true, slug: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    prisma.matchRating.findMany({ 
      where: { userId: user.id },
      include: {
        match: {
          include: {
            participants: { include: { wrestler: true } },
            event: { select: { promotion: true } },
          }
        }
      }
    }),
    prisma.favoriteMatch.findMany({
      where: { userId: user.id },
      include: {
        match: {
          include: {
            event: { select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
            participants: { include: { wrestler: true } }
          }
        }
      }
    }),
    // Fetch watchlist separately and safely
    (async () => {
      try {
        return await prisma.watchListItem.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            userId: true,
            eventId: true,
            createdAt: true,
            event: { select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (err) {
        console.error("Watchlist fetch error on profile:", err);
        return [];
      }
    })(),
    // Fetch user's lists
    (async () => {
      try {
        return await prisma.list.findMany({
          where: { userId: user.id },
          include: {
            items: {
              include: {
                event: { select: { posterUrl: true, title: true } },
                match: { select: { title: true, event: { select: { posterUrl: true, title: true } } } },
              },
              orderBy: { order: "asc" },
              take: 3,
            },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
        });
      } catch (err) {
        console.error("Lists fetch error on profile:", err);
        return [];
      }
    })(),
  ])) as any[];

  const [
    reviews,
    followersCount,
    followingCount,
    matchRatings,
    favMatches,
    watchList,
    userLists,
  ] = results;

  const themePoster = currentUser?.profileThemeEvent?.posterUrl;

  const matchRatingsCount = matchRatings.length;
  const curr = currentUser as any;

  // Cards completed — events where user has rated every match
  const userMatchRatingsForCards = await prisma.matchRating.findMany({
    where: { userId: user.id },
    include: { match: { select: { eventId: true } } },
  });
  const cardEventCounts: Record<string, number> = {};
  userMatchRatingsForCards.forEach((r: any) => {
    cardEventCounts[r.match.eventId] = (cardEventCounts[r.match.eventId] || 0) + 1;
  });
  const eventsForCards = await prisma.event.findMany({
    where: { id: { in: Object.keys(cardEventCounts) } },
    select: { id: true, _count: { select: { matches: true } } },
  });
  const cardsCompleted = eventsForCards.filter(
    (e: any) => e._count.matches > 0 && cardEventCounts[e.id] >= e._count.matches,
  ).length;

  // Prediction accuracy stats — computed live
  const allUserPredictions = await prisma.prediction.findMany({
    where: {
      userId: user.id,
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
    const correct =
      p.isCorrect !== null
        ? p.isCorrect
        : p.match.participants.some((mp: any) => mp.wrestlerId === p.predictedWinnerId);
    if (correct) predictionScore++;
  }
  const predictionAccuracy =
    predictionCount > 0 ? Math.round((predictionScore / predictionCount) * 100) : null;

  const avgRating = reviews.length
    ? (
        reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) /
        reviews.length
      ).toFixed(1)
    : null;

  const promoCount: Record<string, number> = {};
  for (const r of reviews) {
    const p = r.event.promotion;
    promoCount[p] = (promoCount[p] ?? 0) + 1;
  }
  const calculatedFav =
    Object.entries(promoCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  const favPromotion = (user as any).favoritePromotion || calculatedFav || null;

  // Member since
  const memberSince = new Date(
    (user as any).createdAt ?? Date.now(),
  ).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Serialize reviews for client component (dates → strings)
  const serializedReviews = (reviews || []).map((r: any) => ({
    ...r,
    createdAt: (r.createdAt instanceof Date ? r.createdAt : new Date(r.createdAt || Date.now())).toISOString(),
    Reply: (r.Reply || []).map((reply: any) => ({
      ...reply,
      createdAt: (reply.createdAt instanceof Date ? reply.createdAt : new Date(reply.createdAt || Date.now())).toISOString(),
    })),
  }));

  return (
    <div className="pb-20 relative px-2 sm:px-4 lg:px-6">
      <ProfileThemeWrapper posterUrl={themePoster} />
      {(currentUser as any)?.needsUsernameSetup && (
        <UsernameSetupModal username={currentUser?.name || "Wrestler"} />
      )}

      {/* Hero Section / Cover Image */}
      <div className="relative min-h-[320px] md:h-[500px] w-full mt-8 overflow-hidden rounded-[2rem] sm:rounded-[4rem] border border-white/5 shadow-2xl">
         {/* Cover Photo */}
         {themePoster && (
           <div className="absolute inset-0 -z-10">
             <Image 
               src={themePoster} 
               fill 
               className="object-cover saturate-[0.8] brightness-[0.5] scale-110 blur-[2px]" 
               alt="" 
             />
           </div>
         )}
         {/* Gradient Overlay for Title Readability */}
         <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-background via-background/60 to-transparent z-10" />
         
         <div className="max-w-6xl mx-auto px-4 sm:px-6 h-full relative z-20 flex flex-col justify-end pb-8 sm:pb-16">
            <Link
              href="/"
              className="absolute top-20 sm:top-12 left-6 inline-flex items-center gap-2 text-sm font-bold text-white/50 hover:text-white transition-colors group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>

            <div className="flex flex-col md:flex-row items-start md:items-end gap-6 md:gap-10">
               {/* Avatar Area */}
               <div className="relative group/avatar">
                 <div
                   className="w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 rounded-full bg-primary flex items-center justify-center text-4xl sm:text-6xl md:text-8xl font-black text-black shrink-0 shadow-2xl relative z-10 border-4 sm:border-8 border-background overflow-hidden"
                   style={{ 
                     backgroundColor: 'var(--profile-theme-color, var(--primary))',
                     boxShadow: '0 25px 60px -12px rgba(var(--profile-theme-color-rgb), 0.6)'
                   }}
                 >
                   {user.avatarUrl ? (
                     <Image src={user.avatarUrl} fill className="object-cover" alt={user.name || "Avatar"} />
                   ) : (
                     user.name ? user.name.charAt(0).toUpperCase() : "U"
                   )}
                 </div>
                </div>

               {/* User Info */}
               <div className="flex-1 space-y-6 pb-6">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter flex items-center gap-2 sm:gap-4 text-white drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)]">
                      {user.name}
                      {(currentUser as any)?.isVerified && (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 md:w-12 md:h-12 text-blue-400 fill-blue-400/10 shrink-0" />
                      )}
                    </h1>
                  </div>
                  <div className="flex flex-wrap items-center gap-8">
                    <div className="space-y-1">
                      <p className="text-white/30 font-black uppercase tracking-[0.2em] text-[10px]">Rank</p>
                      <p className={`font-black italic text-base sm:text-2xl tracking-tight uppercase ${getRank(reviews.length + matchRatings.length).color}`}>
                        {getRank(reviews.length + matchRatings.length).name}
                      </p>
                    </div>
                    <div className="h-4 w-[1px] bg-white/20 hidden md:block" />
                    <Link
                      href="/profile/edit"
                      className="inline-flex items-center gap-2 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] text-white hover:text-primary transition-all backdrop-blur-xl"
                    >
                      <Pencil className="w-4 h-4" /> Edit Profile
                    </Link>
                  </div>
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
                      {reviews.length}
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

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-0 sm:px-4 lg:px-6 space-y-16">

        {/* Quick Info Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 -mt-6 relative z-30">
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex items-center gap-3 sm:gap-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Joined</p>
              <p className="text-xs sm:text-sm font-black italic truncate">{memberSince}</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex items-center gap-3 sm:gap-6">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Fav Promotion</p>
              <p className="text-xs sm:text-sm font-black italic truncate">{favPromotion ?? "—"}</p>
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex items-center gap-3 sm:gap-6 group">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-0.5">Predictions</p>
              {predictionCount > 0 ? (
                <p className="text-xs sm:text-sm font-black italic">
                  {predictionScore}/{predictionCount}
                  <span className="text-emerald-400 ml-1 sm:ml-2">{predictionAccuracy}%</span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm font-black italic text-muted-foreground/50">None yet</p>
              )}
            </div>
          </div>
          <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-[1.5rem] sm:rounded-[2rem] p-4 sm:p-6 flex flex-row items-center justify-around">
              <FollowListModal
                userId={user.id}
                type="followers"
                count={followersCount}
                label="Followers"
              />
              <div className="w-[1px] h-8 bg-white/5" />
              <FollowListModal
                userId={user.id}
                type="following"
                count={followingCount}
                label="Following"
              />
          </div>
        </div>

      {/* Favorite Matches */}
      <section className="space-y-6">
        <div className="flex items-center gap-6 pt-12">
          <div className="px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-red-500">
              Favorite Matches
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-red-500/20 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              {favMatches.length} Saved
            </span>
            {favMatches.length > 12 && (
              <Link
                href="/profile/favorites"
                className="text-[10px] font-black uppercase text-red-500 hover:text-red-400 underline underline-offset-4 decoration-2"
              >
                See All
              </Link>
            )}
          </div>
        </div>

        {favMatches.length > 0 ? (
          <div className="max-h-[540px] overflow-y-auto rounded-[2rem] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favMatches.slice(0, 12).map((fav: any) => (
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
                    {(fav.match.participants as any[]).slice(0, 3).map((p: any, i: number) => (
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
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
            <Heart className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">
              Your favorite matches list is empty.
            </p>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="space-y-6">
        <div className="flex items-center gap-6 pt-12">
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
              Your Reviews
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              {reviews.length} Written
            </span>
          </div>
        </div>
        <div className="max-h-[600px] overflow-y-auto rounded-[2rem] pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          <ProfileReviews reviews={serializedReviews as any} />
        </div>
      </section>

      {/* Watch List */}
      <section className="space-y-6">
        <div className="flex items-center gap-6 pt-12">
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
              Watch List
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          <div className="flex items-center gap-3">
             <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
               {watchList.length} Events Saved
             </span>
          </div>
        </div>

        {watchList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchList.map((item: any) => (
              <Link
                key={item.id}
                href={`/events/${item.event.slug}`}
                className="group"
              >
                <div className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl mb-3 border border-white/5">
                  <Image
                    src={item.event.posterUrl || "/placeholder.png"}
                    alt={item.event.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2 py-0.5 bg-primary text-black text-[9px] font-black uppercase rounded">
                      {item.event.promotion}
                    </span>
                  </div>
                </div>
                <h3 className="font-black text-xs uppercase italic tracking-tight group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {item.event.title.replace(/–\s\d{4}.*$/, "")}
                </h3>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
            <BookMarked className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">
              Your watch list is empty.
            </p>
            <Link
              href="/events"
              className="btn-primary inline-block mt-4 text-sm"
            >
              Discover Events
            </Link>
          </div>
        )}
      </section>

      {/* Lists */}
      <section className="space-y-6">
        <div className="flex items-center gap-6 pt-12">
          <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
              My Lists
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              {userLists.length} Lists
            </span>
            <Link
              href="/lists/create"
              className="text-[10px] font-black uppercase text-primary hover:text-primary/80 underline underline-offset-4 decoration-2"
            >
              + New List
            </Link>
          </div>
        </div>

        {userLists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userLists.map((list: any) => (
              <div
                key={list.id}
                className="bg-card border border-white/5 hover:border-primary/20 rounded-2xl overflow-hidden transition-all group"
              >
                {/* Cover photo strip */}
                <Link href={`/lists/${list.id}`} className="block">
                  <div className="relative flex h-28 overflow-hidden">
                    {list.items.length > 0 ? (
                      list.items.map((item: any, i: number) => {
                        const posterUrl = item.event?.posterUrl || item.match?.event?.posterUrl || "/placeholder.png";
                        const alt = item.event?.title || item.match?.title || "";
                        return (
                          <div
                            key={i}
                            className="relative flex-1 overflow-hidden"
                            style={{ flexBasis: `${100 / Math.min(list.items.length, 3)}%` }}
                          >
                            <Image src={posterUrl} alt={alt} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 bg-secondary flex items-center justify-center">
                        <List className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
                  </div>
                </Link>

                {/* Card body */}
                <div className="p-4 flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/lists/${list.id}`}
                      className="font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight block"
                    >
                      {list.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      {list.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span>{list.isPublic ? "Public" : "Private"}</span>
                      <span className="mx-1">·</span>
                      <span>{list._count.items} {list.listType === "matches" ? "matches" : "events"}</span>
                    </div>
                  </div>
                  <Link
                    href={`/lists/${list.id}/edit`}
                    className="shrink-0 px-3 py-1.5 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
            <List className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">
              You haven&apos;t created any lists yet.
            </p>
            <Link
              href="/lists/create"
              className="btn-primary inline-block mt-4 text-sm"
            >
              Create a List
            </Link>
          </div>
        )}
      </section>
    </div>
  </div>
  );
}
