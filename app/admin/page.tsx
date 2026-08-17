import { prisma } from "../../lib/prisma";
import Link from "next/link";
import {
  Users,
  Calendar,
  Award,
  MessageSquare,
  TrendingUp,
  ArrowUpRight,
  BarChart2,
  Send,
  Newspaper,
  Activity,
} from "lucide-react";

export default async function AdminHome() {
  const [
    userCountRes, eventCountRes, wrestlerCountRes, matchCountRes, championshipCountRes,
    submissionsRes, draftsRes, pollsRes, upcomingRes,
  ] = await Promise.allSettled([
    prisma.user.count(),
    prisma.event.count(),
    prisma.wrestler.count(),
    prisma.match.count(),
    prisma.championship.count(),
    prisma.eventSubmission.count({ where: { status: "pending" } }),
    prisma.newsPost.count({ where: { status: "draft" } }),
    prisma.poll.count({ where: { isActive: true } }),
    prisma.event.count({ where: { date: { gte: new Date() } } }),
  ]);

  const v = (r: PromiseSettledResult<number>) => (r.status === "fulfilled" ? r.value : 0);
  const userCount = v(userCountRes);
  const eventCount = v(eventCountRes);
  const wrestlerCount = v(wrestlerCountRes);
  const matchCount = v(matchCountRes);
  const championshipCount = v(championshipCountRes);
  const pendingSubmissions = v(submissionsRes);
  const newsDrafts = v(draftsRes);
  const activePolls = v(pollsRes);
  const upcomingEvents = v(upcomingRes);

  const stats = [
    { label: "Users", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Events", value: eventCount, icon: Calendar, href: "/admin/events" },
    { label: "Wrestlers", value: wrestlerCount, icon: Award, href: "/admin/wrestlers" },
    { label: "Matches", value: matchCount, icon: TrendingUp, href: "/admin/matches" },
    { label: "Pending Submissions", value: pendingSubmissions, icon: Send, href: "/admin/submissions", highlight: pendingSubmissions > 0 },
    { label: "News Drafts", value: newsDrafts, icon: Newspaper, href: "/admin/news" },
    { label: "Active Polls", value: activePolls, icon: BarChart2, href: "/admin/polls" },
    { label: "Upcoming Events", value: upcomingEvents, icon: Activity, href: "/admin/events" },
  ];

  const [recentReviews, recentSignups, recentComments, recentSubmissions] = await Promise.all([
    prisma.review.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, slug: true, avatarUrl: true, isAdmin: true, isVerified: true } },
        event: { select: { id: true, title: true, slug: true, promotion: true } },
      },
    }),
    prisma.user.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, slug: true, createdAt: true },
    }),
    prisma.liveComment.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, text: true, createdAt: true, user: { select: { name: true } } },
    }),
    prisma.eventSubmission.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, status: true, createdAt: true },
    }),
  ]);

  // Combined, most-recent-first activity feed
  type FeedItem = { id: string; time: number; kind: string; text: string; href: string };
  const feed: FeedItem[] = [
    ...recentSignups.map((u) => ({
      id: `u-${u.id}`,
      time: new Date(u.createdAt).getTime(),
      kind: "signup",
      text: `${u.name ?? "New user"} joined`,
      href: `/admin/users`,
    })),
    ...recentComments.map((c) => ({
      id: `c-${c.id}`,
      time: new Date(c.createdAt).getTime(),
      kind: "comment",
      text: `${c.user.name ?? "Someone"}: ${c.text.slice(0, 60)}${c.text.length > 60 ? "…" : ""}`,
      href: `/admin/pulse`,
    })),
    ...recentSubmissions.map((s) => ({
      id: `s-${s.id}`,
      time: new Date(s.createdAt).getTime(),
      kind: "submission",
      text: `Submission: ${s.title} (${s.status})`,
      href: `/admin/submissions`,
    })),
  ].sort((a, b) => b.time - a.time).slice(0, 8);

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
          <Link
            key={stat.label}
            href={stat.href}
            className={`bg-white p-4 rounded-2xl border transition-all hover:translate-y-[-2px] ${stat.highlight ? "border-amber-300" : "border-border"}`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className={`p-2 rounded-xl border border-border ${stat.highlight ? "bg-amber-50 text-amber-600" : "bg-secondary text-slate-600"}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <h3 className="text-muted-foreground text-[9px] font-bold uppercase tracking-[0.2em]">
                {stat.label}
              </h3>
            </div>
            <p className="text-xl font-black tracking-tighter text-foreground">
              {stat.value.toLocaleString()}
            </p>
          </Link>
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
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6">
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
                href="/admin/championships"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <span className="font-medium text-sm">Championship Manager</span>
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
                href="/admin/broadcast"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <span className="font-medium text-sm">Broadcast to Users</span>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
              <Link
                href="/admin/polls"
                className="w-full text-left p-4 rounded-xl border border-border hover:bg-slate-50 transition-colors flex items-center justify-between group block"
              >
                <div className="flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                  <span className="font-medium text-sm">Community Polls</span>
                </div>
                <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
              </Link>
            </div>
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-6 border-b border-border">
              <h3 className="font-bold text-lg">Recent Activity</h3>
            </div>
            <div className="p-4 space-y-1">
              {feed.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-4">
                  No activity yet.
                </p>
              ) : (
                feed.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="flex items-start gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{item.text}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        {new Date(item.time).toLocaleString([], { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
