import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  BookMarked,
  Trophy,
  Calendar,
  BarChart2,
  Pencil,
  ChevronLeft,
  Flame,
  Award,
  Users,
  Activity,
  Zap,
  Share2,
  ArrowRight,
} from "lucide-react";
import ProfileReviews from "@components/ProfileReviews";
import FollowListModal from "@components/FollowListModal";
import RankBadge from "@components/RankBadge";

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

  const [
    reviews,
    watchList,
    followersCount,
    followingCount,
    matchRatings,
  ] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        event: true,
        Reply: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
    }),
    prisma.watchListItem.findMany({
      where: { userId: user.id },
      include: { event: true },
      orderBy: { createdAt: "desc" },
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
  ]);

  const matchRatingsCount = matchRatings.length;

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(
        1,
      )
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

  // Streak Calculation (Daily Activity)
  const activityDates = [...reviews, ...matchRatings]
    .map(a => new Date((a as any).createdAt).toDateString());
  const uniqueDates = Array.from(new Set(activityDates))
    .map(d => new Date(d))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 0;
  const today = new Date();
  today.setHours(0,0,0,0);
  
  const lastActivity = uniqueDates[0];
  if (lastActivity) {
    const lastActivityDate = new Date(lastActivity);
    lastActivityDate.setHours(0,0,0,0);
    const diffDays = Math.floor((today.getTime() - lastActivityDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) { // active today or yesterday
      streak = 1;
      for (let i = 0; i < uniqueDates.length - 1; i++) {
        const d1 = new Date(uniqueDates[i]);
        const d2 = new Date(uniqueDates[i+1]);
        d1.setHours(0,0,0,0);
        d2.setHours(0,0,0,0);
        const diff = Math.floor((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
        if (diff === 1) streak++;
        else break;
      }
    }
  }

  // Serialize reviews for client component (dates → strings)
  const serializedReviews = reviews.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    Reply: r.Reply.map((reply) => ({
      ...reply,
      createdAt: reply.createdAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group mb-6"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Profile Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
        <div className="relative bg-card/40 border border-white/5 rounded-[3rem] p-10 flex flex-col md:flex-row items-center md:items-start gap-10">
          {/* Avatar Area */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full bg-primary flex items-center justify-center text-5xl font-black text-black shrink-0 shadow-2xl shadow-primary/30 relative z-10">
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
            <RankBadge totalActivity={reviews.length + matchRatings.length} />
          </div>

          <div className="space-y-6 text-center md:text-left flex-1">
            <div className="space-y-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter">
                  {user.name}
                </h1>
                <Link
                  href="/profile/edit"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-all w-fit mx-auto md:mx-0"
                >
                  <Pencil className="w-3 h-3" /> Edit Profile
                </Link>
              </div>
              <p className="text-muted-foreground font-bold italic text-lg opacity-60">
                {(user as any).email}
              </p>
            </div>

            {/* Social & Key Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-8 border-t border-white/5 pt-6">
              <FollowListModal
                userId={user.id}
                type="followers"
                count={followersCount}
                label="Followers"
              />
              <FollowListModal
                userId={user.id}
                type="following"
                count={followingCount}
                label="Following"
              />
              <div className="h-10 w-px bg-white/5 hidden md:block" />
              <div className="flex flex-col items-start min-w-[80px]">
                <span className="text-2xl font-black italic tracking-tighter text-primary">
                  {avgRating || "—"}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Mean Rating
                </span>
              </div>
              <div className="flex flex-col items-start min-w-[80px]">
                <span className="text-2xl font-black italic tracking-tighter">
                  {reviews.length}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Matches Rated
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legacy Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Member Since
            </p>
            <p className="text-xl font-black italic">{memberSince}</p>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Fav Promotion
            </p>
            <p className="text-xl font-black italic truncate">{favPromotion ?? "—"}</p>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5 text-primary fill-current" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Daily Streak
            </p>
            <p className="text-xl font-black italic">{streak} Days</p>
          </div>
        </div>
        <div className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-4 hover:border-primary/20 transition-all group">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Matches Rated
            </p>
            <p className="text-xl font-black italic">{matchRatingsCount}</p>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            Your Reviews
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {reviews.length} Written
          </span>
        </div>
        <ProfileReviews reviews={serializedReviews as any} />
      </section>

      {/* Watch List */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">
            Watch List
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {watchList.length} Saved
          </span>
        </div>

      {/* Grapped CTA Banner */}
      <section className="relative overflow-hidden group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-purple-600/30 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700" />
        <Link
          href="/grapped"
          className="relative block bg-slate-950/40 border border-white/5 rounded-[3rem] p-8 md:p-12 hover:border-primary/30 transition-all duration-500"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3">
                <span className="px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  New Feature
                </span>
                <span className="text-white/40 text-xs font-black uppercase tracking-[0.2em] italic">
                  Available Now
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
                VIEW YOUR<span className="text-primary truncate"> GRAPPED</span>
              </h2>
              <p className="text-muted-foreground font-medium italic text-lg max-w-lg">
                See your stats, rating distribution, and generate your monthly showcase graphic.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <BarChart2 className="w-8 h-8 text-primary" />
              </div>
              <div className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center group-hover:translate-x-2 transition-transform duration-500">
                <ArrowRight className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </Link>
      </section>
        {watchList.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {watchList.map((item) => (
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
    </div>
  );
}
