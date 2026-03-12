import { prisma } from "@lib/prisma";
import { Users, Star, CalendarDays, Activity, TrendingUp, Zap } from "lucide-react";

export default async function AnalyticsPage() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(now.getDate() - 7);

  const [
    totalUsers,
    newUsersThisMonth,
    totalReviews,
    reviewsThisMonth,
    totalMatchRatings,
    ratingsThisMonth,
    topEvents,
    mostActiveUsers,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.review.count(),
    prisma.review.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.matchRating.count(),
    prisma.matchRating.count(),

    // Top events by review count (last 30 days)
    prisma.event.findMany({
      take: 8,
      include: { reviews: { select: { rating: true } } },
      orderBy: { reviews: { _count: "desc" } },
    }),

    // Most active users (last 30 days)
    prisma.user.findMany({
      take: 8,
      include: { _count: { select: { reviews: true, MatchRating: true } } },
      orderBy: { reviews: { _count: "desc" } },
    }),

    // Last 14 days of reviews per day
    prisma.review.findMany({
      where: { createdAt: { gte: new Date(now.getTime() - 14 * 86400000) } },
      select: { createdAt: true },
    }),
  ]);

  // Build daily activity buckets (last 14 days)
  const buckets: Record<string, number> = {};
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets[d.toLocaleDateString("en-GB", { day: "numeric", month: "short" })] = 0;
  }
  recentActivity.forEach((r) => {
    const key = new Date(r.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
    if (key in buckets) buckets[key]++;
  });
  const maxBucket = Math.max(...Object.values(buckets), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Last 30 days · platform health at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { label: "Total Users",       value: totalUsers,        delta: newUsersThisMonth,   icon: Users,      unit: "users" },
          { label: "Total Reviews",     value: totalReviews,      delta: reviewsThisMonth,    icon: Star,       unit: "reviews" },
          { label: "Match Ratings",     value: totalMatchRatings, delta: ratingsThisMonth,    icon: Activity,   unit: "ratings" },
        ].map(({ label, value, delta, icon: Icon, unit }) => (
          <div key={label} className="bg-white rounded-2xl border border-border p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
              <div className="p-2 rounded-xl bg-slate-50 border border-border">
                <Icon className="w-3.5 h-3.5 text-slate-500" />
              </div>
            </div>
            <p className="text-3xl font-black tracking-tighter">{value.toLocaleString()}</p>
            <p className="text-[11px] text-emerald-600 font-bold">+{delta} this month</p>
          </div>
        ))}
      </div>

      {/* 14-day Review Activity Chart */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-black text-sm uppercase tracking-widest">Reviews · Last 14 Days</h2>
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex items-end gap-1.5 h-32">
          {Object.entries(buckets).map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1 group">
              <span className="text-[8px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {count}
              </span>
              <div
                className="w-full bg-primary rounded-t-sm transition-all"
                style={{ height: `${(count / maxBucket) * 100}%`, minHeight: count > 0 ? "4px" : "2px", opacity: count === 0 ? 0.15 : 1 }}
              />
              <span className="text-[7px] text-muted-foreground font-bold rotate-45 origin-left hidden sm:block">{day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Events */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-widest">Top Events by Reviews</h2>
            <CalendarDays className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {topEvents.map((e, i) => {
              const avg = e.reviews.length
                ? (e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length).toFixed(1)
                : "—";
              return (
                <div key={e.id} className="flex items-center gap-4 px-6 py-3">
                  <span className="text-[11px] font-black text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{e.title}</p>
                    <p className="text-[10px] text-muted-foreground">{e.promotion}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black">{e.reviews.length}</p>
                    <p className="text-[9px] text-muted-foreground">{avg}★</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Active Users */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-black text-sm uppercase tracking-widest">Most Active Users</h2>
            <Zap className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="divide-y divide-border">
            {mostActiveUsers.map((u, i) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-3">
                <span className="text-[11px] font-black text-muted-foreground w-4">{i + 1}</span>
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-black text-primary shrink-0">
                  {u.name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{u.name ?? "Unnamed"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-black">{u._count.reviews + u._count.MatchRating}</p>
                  <p className="text-[9px] text-muted-foreground">{u._count.reviews}r · {u._count.MatchRating}m</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
