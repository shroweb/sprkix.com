import { prisma } from "@lib/prisma";
import Link from "next/link";
import { Star, Activity, UserPlus, Bookmark, Zap } from "lucide-react";

export default async function ActivityFeedPage() {
  const [reviews, ratings, users, watchlist] = await Promise.all([
    prisma.review.findMany({
      take: 30,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, slug: true } }, event: { select: { title: true, slug: true } } },
    }),
    prisma.matchRating.findMany({
      take: 30,
      orderBy: { id: "desc" },
      include: {
        user: { select: { name: true, slug: true } },
        match: { select: { title: true, event: { select: { title: true, slug: true } } } },
      },
    }),
    prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, email: true, createdAt: true, slug: true },
    }),
    prisma.watchListItem.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true } }, event: { select: { title: true, slug: true } } },
    }),
  ]);

  // Merge and sort all activity by date
  type FeedItem = { ts: Date; type: string; icon: any; color: string; label: string; link?: string };
  const feed: FeedItem[] = [
    ...reviews.map(r => ({
      ts: r.createdAt,
      type: "review",
      icon: Star,
      color: "text-yellow-500 bg-yellow-50 border-yellow-100",
      label: `${r.user.name ?? "Someone"} reviewed ${r.event.title} — ${r.rating}★`,
      link: `/events/${r.event.slug}`,
    })),
    ...ratings.map(r => ({
      ts: new Date(),  // fallback since createdAt may not be in types yet
      type: "rating",
      icon: Zap,
      color: "text-primary bg-primary/5 border-primary/10",
      label: `${r.user.name ?? "Someone"} rated "${r.match.title}" (${r.match.event.title}) ${r.rating}★`,
      link: `/events/${r.match.event.slug}`,
    })),
    ...users.map(u => ({
      ts: u.createdAt,
      type: "signup",
      icon: UserPlus,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      label: `${u.name ?? u.email} joined sprkix`,
      link: undefined,
    })),
    ...watchlist.map(w => ({
      ts: w.createdAt,
      type: "watchlist",
      icon: Bookmark,
      color: "text-blue-500 bg-blue-50 border-blue-100",
      label: `${w.user.name ?? "Someone"} added ${w.event.title} to watchlist`,
      link: `/events/${w.event.slug}`,
    })),
  ].sort((a, b) => b.ts.getTime() - a.ts.getTime()).slice(0, 80);

  function timeAgo(date: Date) {
    const s = Math.floor((Date.now() - date.getTime()) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Activity Feed</h1>
          <p className="text-muted-foreground text-sm mt-1">Latest {feed.length} actions across the platform</p>
        </div>
        <div className="flex gap-2 text-[10px] font-black uppercase">
          {[["review","★ Reviews","text-yellow-600"],["rating","⚡ Ratings","text-primary"],["signup","👤 Signups","text-emerald-600"],["watchlist","🔖 Saved","text-blue-500"]].map(([type,label,cls]) => (
            <span key={type} className={`px-3 py-1.5 bg-white border border-border rounded-lg ${cls}`}>{label}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border divide-y divide-border max-h-[78vh] overflow-y-auto">
        {feed.map((item, i) => {
          const Icon = item.icon;
          return (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 transition-colors">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${item.color}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-sm flex-1 min-w-0 truncate">{item.label}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[10px] text-muted-foreground font-bold">{timeAgo(item.ts)}</span>
                {item.link && (
                  <Link href={item.link} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">View</Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
