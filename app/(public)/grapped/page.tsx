import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import {
  ChevronLeft,
  Star,
  Trophy,
  Flame,
  Zap,
  Calendar,
  TrendingUp,
} from "lucide-react";
import GrappedClient from "@components/GrappedClient";

export const dynamic = "force-dynamic";

export default async function GrappedPage() {
  const user = await getUserFromServerCookie();
  if (!user)
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground font-bold italic">
          You must be logged in to view your GRAPPED records.
        </p>
        <Link href="/login" className="btn-primary inline-block mt-6">
          Login
        </Link>
      </div>
    );

  const [reviews, matchRatings] = await Promise.all([
    prisma.review.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { event: true },
    }),
    prisma.matchRating.findMany({
      where: { userId: user.id },
      include: {
        match: {
          include: {
            event: { select: { promotion: true, title: true } },
          },
        },
      },
    }),
  ]);

  const now = new Date();
  const firstOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const reviewsThisMonth = reviews.filter((r) => r.createdAt >= firstOfThisMonth);
  const matchRatingsThisMonth = matchRatings.filter(
    (mr) => (mr as any).createdAt >= firstOfThisMonth
  );

  // All ratings this month (reviews + match ratings)
  const allRatingsThisMonth = [
    ...matchRatingsThisMonth.map((mr) => mr.rating),
    ...reviewsThisMonth.map((r) => r.rating),
  ].filter((r) => r > 0);

  const ratingBreakdown = {
    five:  allRatingsThisMonth.filter((r) => r >= 4.75).length,
    four:  allRatingsThisMonth.filter((r) => r >= 3.75 && r < 4.75).length,
    three: allRatingsThisMonth.filter((r) => r >= 2.75 && r < 3.75).length,
    two:   allRatingsThisMonth.filter((r) => r >= 1.75 && r < 2.75).length,
    one:   allRatingsThisMonth.filter((r) => r < 1.75).length,
  };

  const avgThisMonth = allRatingsThisMonth.length
    ? (allRatingsThisMonth.reduce((a, b) => a + b, 0) / allRatingsThisMonth.length).toFixed(2)
    : null;

  // Promotion of the Month
  const promoMonthRatings: Record<string, { total: number; count: number }> = {};
  matchRatingsThisMonth.filter((mr) => mr.rating > 0).forEach((mr) => {
    const promo = (mr.match as any).event?.promotion;
    if (!promo) return;
    if (!promoMonthRatings[promo]) promoMonthRatings[promo] = { total: 0, count: 0 };
    promoMonthRatings[promo].total += mr.rating;
    promoMonthRatings[promo].count += 1;
  });
  reviewsThisMonth.forEach((r) => {
    const promo = r.event.promotion;
    if (!promoMonthRatings[promo]) promoMonthRatings[promo] = { total: 0, count: 0 };
    promoMonthRatings[promo].total += r.rating;
    promoMonthRatings[promo].count += 1;
  });
  const promotionOfMonth =
    Object.entries(promoMonthRatings)
      .map(([name, stat]) => ({ name, avg: stat.total / stat.count, count: stat.count }))
      .filter((p) => p.count >= 1)
      .sort((a, b) => b.avg - a.avg || b.count - a.count)[0] || null;

  // Top event reviewed this month
  const topEventThisMonth =
    reviewsThisMonth.length > 0
      ? reviewsThisMonth.reduce((best, r) => (r.rating > best.rating ? r : best), reviewsThisMonth[0])
      : null;

  // Hottest match rated this month
  const hottestMatchThisMonth =
    matchRatingsThisMonth.length > 0
      ? matchRatingsThisMonth.reduce(
          (best, mr) => (mr.rating > best.rating ? mr : best),
          matchRatingsThisMonth[0]
        )
      : null;

  // All-time totals
  const allTimeReviews = reviews.length;
  const allTimeMatches = matchRatings.length;
  const allTimeAvg =
    reviews.length > 0
      ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(2)
      : null;

  // Unique promotions watched all time
  const uniquePromos = new Set(reviews.map((r) => r.event.promotion)).size;

  const month = now.toLocaleDateString("en-US", { month: "long" });

  return (
    <div className="space-y-16 pb-20 max-w-6xl mx-auto px-4">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </Link>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-1 w-12 bg-primary" />
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-white">
            YOUR<span className="text-primary">GRAPPED</span>
          </h1>
        </div>
        <p className="text-muted-foreground font-medium italic text-lg max-w-xl">
          Your wrestling legacy for {month}. Document your journey and share your monthly highlights.
        </p>
      </div>

      {/* Monthly Snapshot */}
      <section className="bg-slate-950 border border-primary/20 rounded-[2rem] sm:rounded-[3.5rem] p-6 sm:p-10 md:p-16 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] -mr-48 -mt-48 transition-all duration-1000 group-hover:scale-110" />

        <div className="relative z-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">
              Monthly Snapshot
            </h2>
            <GrappedClient
              month={month}
              reviewsCount={reviewsThisMonth.length}
              matchesCount={matchRatingsThisMonth.length}
              ratingBreakdown={ratingBreakdown}
              avgThisMonth={avgThisMonth}
              promotionOfMonth={promotionOfMonth}
              topEventTitle={topEventThisMonth?.event.title.replace(/–\s\d{4}.*$/, "").trim() ?? null}
              topEventRating={topEventThisMonth?.rating ?? null}
            />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Left stats column */}
            <div className="grid grid-cols-2 md:grid-cols-1 gap-6">
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-4 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Star className="w-6 h-6 text-primary fill-current" />
                </div>
                <div>
                  <p className="text-3xl font-black italic text-white">{reviewsThisMonth.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">New Reviews</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 flex items-center gap-4 hover:border-primary/20 transition-colors">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-3xl font-black italic text-white">{matchRatingsThisMonth.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Matches Rated</p>
                </div>
              </div>

              {promotionOfMonth && (
                <div className="col-span-2 md:col-span-1 bg-primary/10 border border-primary/20 rounded-3xl p-6 flex items-center gap-4 hover:border-primary/40 transition-colors">
                  <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                    <Trophy className="w-6 h-6 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-black italic text-white truncate">{promotionOfMonth.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Promotion of Month</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {promotionOfMonth.avg.toFixed(2)} avg · {promotionOfMonth.count} rated
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Rating breakdown */}
            <div className="md:col-span-2 bg-white/5 rounded-[2.5rem] p-8 border border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Your Star Distribution</p>
                {avgThisMonth && (
                  <span className="text-xs font-black italic text-white bg-primary/20 px-3 py-1 rounded-full">
                    {avgThisMonth} avg
                  </span>
                )}
              </div>

              {allRatingsThisMonth.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <Zap className="w-10 h-10 text-primary/20 animate-pulse" />
                  <p className="text-muted-foreground font-bold italic text-center">
                    Rate some matches this month to see your breakdown!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {([
                    { label: "5 Stars", count: ratingBreakdown.five,  color: "bg-yellow-400" },
                    { label: "4 Stars", count: ratingBreakdown.four,  color: "bg-primary" },
                    { label: "3 Stars", count: ratingBreakdown.three, color: "bg-amber-600" },
                    { label: "2 Stars", count: ratingBreakdown.two,   color: "bg-orange-700" },
                    { label: "1 Star",  count: ratingBreakdown.one,   color: "bg-red-700" },
                  ] as const).map(({ label, count, color }) => (
                    <div key={label} className="flex items-center gap-4">
                      <span className="w-24 text-[11px] font-black uppercase tracking-widest text-white/60 shrink-0">{label}</span>
                      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-700`}
                          style={{ width: allRatingsThisMonth.length ? `${(count / allRatingsThisMonth.length) * 100}%` : "0%" }}
                        />
                      </div>
                      <span className="text-sm font-black italic text-white w-6 text-right shrink-0">{count}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* This month highlights */}
              {(topEventThisMonth || hottestMatchThisMonth) && (
                <div className="pt-6 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {topEventThisMonth && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">Top Event</p>
                      <p className="text-sm font-black italic text-white leading-tight line-clamp-2">
                        {topEventThisMonth.event.title.replace(/–\s\d{4}.*$/, "").trim()}
                      </p>
                      <div className="flex text-primary gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < topEventThisMonth.rating ? "fill-current" : "text-white/10"}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  {hottestMatchThisMonth && (
                    <div className="space-y-1">
                      <p className="text-[9px] font-black uppercase tracking-widest text-primary/50">Hottest Match</p>
                      <p className="text-sm font-black italic text-white leading-tight line-clamp-2">
                        {(hottestMatchThisMonth.match as any).event?.title?.replace(/–\s\d{4}.*$/, "").trim() ?? "—"}
                      </p>
                      <p className="text-xs font-black text-primary">{hottestMatchThisMonth.rating.toFixed(2)}★</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* All-Time Totals */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <span className="w-1 h-8 bg-primary rounded-full block" />
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">All-Time Record</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: Star,       value: allTimeReviews, label: "Events Reviewed" },
            { icon: Flame,      value: allTimeMatches, label: "Matches Rated" },
            { icon: TrendingUp, value: allTimeAvg ? `${allTimeAvg}★` : "—", label: "Avg Event Rating" },
            { icon: Calendar,   value: uniquePromos, label: "Promos Watched" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="bg-card/40 border border-white/5 rounded-3xl p-6 text-center hover:border-primary/20 transition-colors">
              <Icon className="w-6 h-6 text-primary mx-auto mb-3" />
              <p className="text-3xl font-black italic text-white">{value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
