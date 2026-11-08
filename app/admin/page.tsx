import Link from "next/link";
import { prisma } from "@lib/prisma";
import {
  Users, Calendar, Star, Target, Send, Newspaper, ImageOff, ListChecks, CalendarX, Crown,
  Plus, Download, Megaphone, ArrowUpRight, TrendingUp, TrendingDown, Minus, CheckCircle2, type LucideIcon,
} from "lucide-react";

export const dynamic = "force-dynamic";

const DAY = 86_400_000;
// Request-time clock (this page is force-dynamic).
const currentTime = () => Date.now();

async function safe<T>(p: Promise<T>, fallback: T): Promise<T> {
  try {
    return await p;
  } catch {
    return fallback;
  }
}

function bucketByDay(dates: Date[], days: number, now: number) {
  const out = Array<number>(days).fill(0);
  for (const d of dates) {
    const idx = days - 1 - Math.floor((now - d.getTime()) / DAY);
    if (idx >= 0 && idx < days) out[idx]++;
  }
  return out;
}

export default async function AdminHome() {
  const now = currentTime();
  const d14 = new Date(now - 14 * DAY);
  const in7 = new Date(now + 7 * DAY);

  const [
    totals, pendingSubs, drafts, upcoming, noCard, noPoster, unresulted,
    users14, reviews14, ratings14, predictions14, recentReviews, recentSubs, recentLogs, lineal,
  ] = await Promise.all([
    safe(Promise.all([prisma.user.count(), prisma.event.count(), prisma.wrestler.count(), prisma.match.count(), prisma.review.count()]), [0, 0, 0, 0, 0]),
    safe(prisma.eventSubmission.count({ where: { status: "pending" } }), 0),
    safe(prisma.newsPost.count({ where: { status: "draft" } }), 0),
    safe(
      prisma.event.findMany({
        where: { date: { gte: new Date(now - DAY), lte: in7 } },
        orderBy: { date: "asc" },
        take: 8,
        select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, _count: { select: { matches: true } } },
      }),
      [],
    ),
    safe(prisma.event.count({ where: { date: { gte: new Date(), lte: in7 }, matches: { none: {} } } }), 0),
    safe(prisma.event.count({ where: { date: { gte: d14 }, posterUrl: null } }), 0),
    safe(
      prisma.event.count({
        where: { date: { lt: new Date(now - DAY), gte: d14 }, matches: { some: {} }, NOT: { matches: { some: { participants: { some: { isWinner: true } } } } } },
      }),
      0,
    ),
    safe(prisma.user.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }), []),
    safe(prisma.review.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }), []),
    safe(prisma.matchRating.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }), []),
    safe(prisma.prediction.findMany({ where: { createdAt: { gte: d14 } }, select: { createdAt: true } }), []),
    safe(
      prisma.review.findMany({
        take: 6,
        orderBy: { createdAt: "desc" },
        select: { id: true, rating: true, comment: true, createdAt: true, user: { select: { name: true } }, event: { select: { title: true, slug: true } } },
      }),
      [],
    ),
    safe(prisma.eventSubmission.findMany({ where: { status: "pending" }, take: 4, orderBy: { createdAt: "desc" }, select: { id: true, title: true, promotion: true, createdAt: true } }), []),
    safe(prisma.adminLog.findMany({ take: 6, orderBy: { createdAt: "desc" }, select: { id: true, action: true, detail: true, createdAt: true, actor: { select: { name: true } } } }), []),
    safe(
      prisma.linealTitle.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, name: true, emoji: true, reigns: { where: { endedAt: null }, take: 1, select: { startedAt: true, wrestler: { select: { name: true } } } } },
      }),
      [],
    ),
  ]);

  const [userTotal, eventTotal, wrestlerTotal, matchTotal, reviewTotal] = totals;
  const series = {
    users: bucketByDay(users14.map((x) => x.createdAt), 14, now),
    reviews: bucketByDay(reviews14.map((x) => x.createdAt), 14, now),
    ratings: bucketByDay(ratings14.map((x) => x.createdAt), 14, now),
    predictions: bucketByDay(predictions14.map((x) => x.createdAt), 14, now),
  };
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

  const kpis: { label: string; icon: LucideIcon; total: number; data: number[]; href: string }[] = [
    { label: "Users", icon: Users, total: userTotal, data: series.users, href: "/admin/users" },
    { label: "Reviews", icon: Star, total: reviewTotal, data: series.reviews, href: "/admin/reviews" },
    { label: "Match ratings", icon: ListChecks, total: matchTotal, data: series.ratings, href: "/admin/analytics" },
    { label: "Predictions", icon: Target, total: 0, data: series.predictions, href: "/admin/analytics" },
  ];

  const attention: { label: string; count: number; href: string; icon: LucideIcon; hint: string }[] = [
    { label: "Event submissions to review", count: pendingSubs, href: "/admin/submissions", icon: Send, hint: "Users are waiting on these" },
    { label: "Upcoming events with no card", count: noCard, href: "/admin/events", icon: CalendarX, hint: "Next 7 days, no matches yet" },
    { label: "Past events missing results", count: unresulted, href: "/admin/events", icon: ListChecks, hint: "Last 14 days, no winners set" },
    { label: "Recent events without a poster", count: noPoster, href: "/admin/scraper", icon: ImageOff, hint: "Run the metadata scraper" },
    { label: "News drafts", count: drafts, href: "/admin/news", icon: Newspaper, hint: "Unpublished posts" },
  ].filter((a) => a.count > 0);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.25em] text-primary">
            {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
          </p>
          <h1 className="text-3xl font-black tracking-tight mt-1">{greet}.</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {eventTotal.toLocaleString()} events · {wrestlerTotal.toLocaleString()} wrestlers · {matchTotal.toLocaleString()} matches in the archive
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ActionLink href="/admin/events" icon={Plus} label="Add event" primary />
          <ActionLink href="/admin/import" icon={Download} label="Import" />
          <ActionLink href="/admin/news" icon={Newspaper} label="New post" />
          <ActionLink href="/admin/broadcast" icon={Megaphone} label="Broadcast" />
        </div>
      </div>

      {/* Needs attention */}
      <section>
        <SectionTitle>Needs attention</SectionTitle>
        {attention.length === 0 ? (
          <div className="bg-card border border-border p-5 flex items-center gap-3 text-sm text-muted-foreground">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> All clear. Nothing is waiting on you.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {attention.map((a) => (
              <Link key={a.label} href={a.href} className="group bg-card border border-border hover:border-primary/50 p-4 flex items-center gap-4 transition-colors">
                <div className="w-10 h-10 bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <a.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{a.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{a.hint}</p>
                </div>
                <span className="text-2xl font-black text-primary tabular-nums">{a.count}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* KPIs */}
      <section>
        <SectionTitle>Last 7 days</SectionTitle>
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
          {kpis.map((k) => {
            const cur = sum(k.data.slice(7));
            const prev = sum(k.data.slice(0, 7));
            const delta = prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);
            const max = Math.max(1, ...k.data);
            const Trend = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus;
            return (
              <Link key={k.label} href={k.href} className="bg-card border border-border hover:border-primary/40 p-4 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    <k.icon className="w-3.5 h-3.5" /> {k.label}
                  </span>
                  <span className={`flex items-center gap-1 text-[11px] font-bold ${delta > 0 ? "text-emerald-400" : delta < 0 ? "text-red-400" : "text-slate-500"}`}>
                    <Trend className="w-3 h-3" /> {delta > 0 ? "+" : ""}{delta}%
                  </span>
                </div>
                <p className="text-3xl font-black tracking-tight mt-2 tabular-nums">{cur.toLocaleString()}</p>
                <p className="text-[11px] text-muted-foreground">
                  new{k.total > 0 ? ` · ${k.total.toLocaleString()} total` : ""}
                </p>
                <div className="flex items-end gap-[3px] h-10 mt-3" aria-hidden>
                  {k.data.map((v, i) => (
                    <div key={i} className={i >= 7 ? "bg-primary" : "bg-primary/30"} style={{ height: `${Math.max(6, (v / max) * 100)}%`, width: "100%" }} />
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Upcoming */}
        <section className="xl:col-span-2">
          <SectionTitle action={{ href: "/admin/events", label: "All events" }}>Coming up</SectionTitle>
          <div className="bg-card border border-border divide-y divide-border">
            {upcoming.length === 0 && <Empty text="No events in the next 7 days." />}
            {upcoming.map((e) => (
              <Link key={e.id} href={`/admin/events/${e.id}/edit`} className="flex items-center gap-4 p-3 hover:bg-white/[0.03]">
                <div className="w-12 text-center shrink-0">
                  <p className="text-[10px] font-black uppercase text-primary">{e.date.toLocaleDateString("en-GB", { month: "short" })}</p>
                  <p className="text-xl font-black leading-none">{e.date.getDate()}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.promotion}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {e._count.matches === 0 && <Chip tone="red">No card</Chip>}
                  {!e.posterUrl && <Chip tone="amber">No poster</Chip>}
                  {e._count.matches > 0 && <Chip>{e._count.matches} matches</Chip>}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Lineal */}
        <section>
          <SectionTitle action={{ href: "/admin/lineal", label: "Manage" }}>Lineal champions</SectionTitle>
          <div className="bg-card border border-border divide-y divide-border">
            {lineal.length === 0 && <Empty text="No lineal titles yet." />}
            {lineal.map((t) => {
              const r = t.reigns[0];
              return (
                <Link key={t.id} href="/admin/lineal" className="flex items-center gap-3 p-3 hover:bg-white/[0.03]">
                  <Crown className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-muted-foreground truncate">{t.name}</p>
                    <p className="text-sm font-bold truncate">{r?.wrestler.name ?? "Vacant"}</p>
                  </div>
                  {r && <span className="text-[11px] text-muted-foreground tabular-nums">{Math.floor((now - r.startedAt.getTime()) / DAY)}d</span>}
                </Link>
              );
            })}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="xl:col-span-2">
          <SectionTitle action={{ href: "/admin/reviews", label: "All reviews" }}>Latest reviews</SectionTitle>
          <div className="bg-card border border-border divide-y divide-border">
            {recentReviews.length === 0 && <Empty text="No reviews yet." />}
            {recentReviews.map((r) => (
              <div key={r.id} className="p-3 flex gap-3">
                <div className="w-8 h-8 bg-secondary flex items-center justify-center text-xs font-black shrink-0">
                  {(r.user?.name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <span className="font-bold">{r.user?.name ?? "Someone"}</span>{" "}
                    <span className="text-muted-foreground">on</span>{" "}
                    <Link href={`/events/${r.event.slug}`} className="text-primary hover:underline">{r.event.title}</Link>
                  </p>
                  {r.comment && <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{r.comment}</p>}
                </div>
                <span className="flex items-center gap-1 text-sm font-black text-primary shrink-0">
                  <Star className="w-3.5 h-3.5 fill-current" /> {r.rating}
                </span>
              </div>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section>
            <SectionTitle action={{ href: "/admin/submissions", label: "Queue" }}>Pending submissions</SectionTitle>
            <div className="bg-card border border-border divide-y divide-border">
              {recentSubs.length === 0 && <Empty text="Nothing pending." />}
              {recentSubs.map((s) => (
                <Link key={s.id} href="/admin/submissions" className="flex items-center justify-between gap-3 p-3 hover:bg-white/[0.03]">
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground">{s.promotion}</p>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </section>
          <section>
            <SectionTitle action={{ href: "/admin/logs", label: "Full log" }}>Admin activity</SectionTitle>
            <div className="bg-card border border-border divide-y divide-border">
              {recentLogs.length === 0 && <Empty text="No admin actions logged." />}
              {recentLogs.map((l) => (
                <div key={l.id} className="p-3">
                  <p className="text-xs font-bold truncate">{l.actor?.name ?? "Admin"} · <span className="text-primary">{l.action}</span></p>
                  {l.detail && <p className="text-xs text-muted-foreground truncate">{l.detail}</p>}
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">
                    {l.createdAt.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: { href: string; label: string } }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">{children}</h2>
      {action && (
        <Link href={action.href} className="text-xs font-bold text-primary hover:underline">{action.label} →</Link>
      )}
    </div>
  );
}

function ActionLink({ href, icon: Icon, label, primary }: { href: string; icon: LucideIcon; label: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider border transition-colors ${
        primary ? "bg-primary text-primary-foreground border-primary hover:brightness-110" : "bg-card border-border text-foreground hover:border-primary/50"
      }`}
    >
      <Icon className="w-3.5 h-3.5" /> {label}
    </Link>
  );
}

function Chip({ children, tone }: { children: React.ReactNode; tone?: "red" | "amber" }) {
  const cls = tone === "red" ? "text-red-400 border-red-500/30 bg-red-500/10" : tone === "amber" ? "text-amber-400 border-amber-500/30 bg-amber-500/10" : "text-muted-foreground border-border";
  return <span className={`text-[10px] font-bold uppercase tracking-wider border px-2 py-0.5 ${cls}`}>{children}</span>;
}

function Empty({ text }: { text: string }) {
  return <p className="p-5 text-sm text-muted-foreground italic">{text}</p>;
}
