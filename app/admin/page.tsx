import { prisma } from "../../lib/prisma";
import Link from "next/link";
import {
  Users,
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";

export default async function AdminHome() {
  const userCount = await prisma.user.count();
  const eventCount = await prisma.event.count();
  const wrestlerCount = await prisma.wrestler.count();
  const matchCount = await prisma.match.count();

  const stats = [
    { label: "Users", value: userCount, icon: Users },
    { label: "Events", value: eventCount, icon: Calendar },
    { label: "Wrestlers", value: wrestlerCount, icon: Award },
    { label: "Matches", value: matchCount, icon: TrendingUp },
  ];

  const recentReviews = await prisma.review.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { user: true, event: { select: { id: true, title: true, slug: true, promotion: true } } },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of the Poison Rana database.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white p-4 rounded-2xl border border-border transition-all hover:translate-y-[-2px]"
          >
            <div className="flex justify-between items-center mb-3">
              <div className="p-2 rounded-xl bg-secondary text-slate-600 border border-border">
                <stat.icon className="w-4 h-4" />
              </div>
              <h3 className="text-muted-foreground text-[9px] font-black uppercase tracking-[0.2em]">
                {stat.label}
              </h3>
            </div>
            <p className="text-xl font-black tracking-tighter text-foreground">
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Reviews */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h3 className="font-bold text-lg">Recent Reviews</h3>
            <Link
              href="/admin/events"
              className="text-sm text-primary font-semibold hover:underline"
            >
              View Events
            </Link>
          </div>
          <div className="p-6">
            <div className="space-y-5">
              {recentReviews.length > 0 ? (
                recentReviews.map((review) => (
                  <div
                    key={review.id}
                    className="flex gap-4 items-center group"
                  >
                    <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold">
                      {review.user?.name?.charAt(0).toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        <span className="font-bold">{review.user?.name}</span>{" "}
                        reviewed{" "}
                        <span className="text-primary italic">
                          {review.event?.title}
                        </span>
                      </p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase">
                        {review.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, star) => (
                        <div
                          key={star}
                          className={`w-1.5 h-1.5 rounded-full ${star < (review.rating || 0) ? "bg-primary" : "bg-slate-200"}`}
                        ></div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 space-y-2">
                  <MessageSquare className="w-8 h-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground italic">
                    No recent activity found.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-border p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link
                href="/admin/events"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <span className="font-medium text-sm">Manage Events</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
              <Link
                href="/admin/wrestlers"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <span className="font-medium text-sm">Manage Roster</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
              <Link
                href="/admin/settings"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <span className="font-medium text-sm">Site Settings</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-primary/5 p-4 rounded-xl border border-primary/20">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[10px] text-foreground font-bold uppercase tracking-wider">
                Database
              </p>
              <p className="text-[10px] text-primary font-bold">Connected</p>
            </div>
            <div className="h-1.5 w-full bg-primary/10 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-full animate-pulse"></div>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 font-medium">
              PostgreSQL via Docker + Prisma ORM.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
