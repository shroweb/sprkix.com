import { prisma } from "@lib/prisma";
import { getPromotionNewsSlug } from "@lib/news";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Calendar, Star, Trophy, Crown, Radio, Target } from "lucide-react";
import { promoAccent, promoChampionCode } from "@lib/promo-theme";
import { getAllCurrentChampions } from "@lib/champions";
import { BeltArt } from "@components/BeltImage";

export const dynamic = "force-dynamic";

async function getPromotionPageData(slug: string) {
  const promotions = await prisma.promotion.findMany({
    select: {
      id: true,
      shortName: true,
      fullName: true,
      logoUrl: true,
      aliases: { select: { fullName: true } },
    },
  });

  const promotion = promotions.find((item) => getPromotionNewsSlug(item.shortName) === slug);
  if (!promotion) return null;

  const [events, championships, upcoming, predictions] = await Promise.all([
    prisma.event.findMany({
      where: { promotion: { equals: promotion.shortName, mode: "insensitive" } },
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        slug: true,
        date: true,
        posterUrl: true,
        reviews: { select: { rating: true } },
      },
    }),
    prisma.championship.findMany({
      where: { promotion: { equals: promotion.shortName, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.event.findFirst({
      where: {
        promotion: { equals: promotion.shortName, mode: "insensitive" },
        date: { gte: new Date(Date.now() - 6 * 3600 * 1000) },
      },
      orderBy: { date: "asc" },
      select: { id: true, title: true, slug: true, date: true, posterUrl: true, startTime: true, venue: true, city: true },
    }),
    prisma.prediction.findMany({
      where: {
        isCorrect: { not: null },
        match: { event: { promotion: { equals: promotion.shortName, mode: "insensitive" } } },
      },
      select: { userId: true, isCorrect: true },
      take: 20000,
    }),
  ]);

  // Top predictors for this promotion (min 3 resolved picks)
  const tally = new Map<string, { right: number; total: number }>();
  for (const p of predictions) {
    const t = tally.get(p.userId) ?? { right: 0, total: 0 };
    t.total += 1;
    if (p.isCorrect) t.right += 1;
    tally.set(p.userId, t);
  }
  const top = [...tally.entries()]
    .filter(([, t]) => t.total >= 3)
    .sort((a, b) => b[1].right - a[1].right || b[1].right / b[1].total - a[1].right / a[1].total)
    .slice(0, 5);
  const users = top.length
    ? await prisma.user.findMany({
        where: { id: { in: top.map(([id]) => id) } },
        select: { id: true, name: true, slug: true, avatarUrl: true },
      })
    : [];
  const topPredictors = top.flatMap(([id, t]) => {
    const u = users.find((x) => x.id === id);
    return u ? [{ user: u, ...t }] : [];
  });

  return { promotion, events, championships, upcoming, topPredictors };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPromotionPageData(slug);
  if (!data) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const name = data.promotion.fullName || data.promotion.shortName;
  const description = `Browse ${name} events, ratings, and archives on Poison Rana.`;
  const url = `${siteUrl}/promotions/${slug}`;

  return {
    title: `${name} Promotion`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: `${name} | Poison Rana`,
      description,
      url,
      type: "website",
      images: data.promotion.logoUrl ? [{ url: data.promotion.logoUrl }] : undefined,
    },
    twitter: {
      card: data.promotion.logoUrl ? "summary_large_image" : "summary",
      title: `${name} | Poison Rana`,
      description,
      images: data.promotion.logoUrl ? [data.promotion.logoUrl] : undefined,
    },
  };
}

export default async function PromotionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPromotionPageData(slug);
  if (!data) return notFound();

  const { promotion, events, championships, upcoming, topPredictors } = data;
  const promotionName = promotion.fullName || promotion.shortName;
  const accent = promoAccent(promotion.shortName);
  const code = promoChampionCode(promotion.shortName);
  const champions = code ? getAllCurrentChampions().filter((c) => c.promotion === code) : [];
  const recent = events.filter((e) => !upcoming || e.id !== upcoming.id);
  const rated = events.flatMap((e) => e.reviews.map((r) => r.rating));
  const avg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      <Link
        href="/promotions"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Promotions
      </Link>

      <header
        className="relative overflow-hidden border border-white/10 p-6 sm:p-10"
        style={{ background: `linear-gradient(135deg, ${accent}33 0%, rgba(2,6,23,0.9) 55%)` }}
      >
        <div className="absolute inset-y-0 left-0 w-1" style={{ background: accent }} />
        <div className="flex flex-wrap items-center gap-6">
          {promotion.logoUrl && (
            <div className="grid h-20 w-20 shrink-0 place-items-center bg-white/5 ring-1 ring-white/10">
              <img src={promotion.logoUrl} alt="" className="max-h-14 max-w-14 object-contain" />
            </div>
          )}
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>Promotion Hub</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter">{promotionName}</h1>
          </div>
        </div>
        <dl className="mt-8 grid grid-cols-3 gap-px bg-white/10 text-center">
          {[
            ["Events", events.length.toLocaleString()],
            ["Avg rating", avg ? avg.toFixed(2) : "—"],
            ["Champions", champions.length ? String(champions.length) : String(championships.length || "—")],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-950/70 px-3 py-4">
              <dd className="text-2xl font-black tabular-nums">{v}</dd>
              <dt className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
            </div>
          ))}
        </dl>
      </header>

      {upcoming && (
        <Link
          href={`/events/${upcoming.slug}`}
          className="group flex items-center gap-5 border border-white/10 bg-card/85 p-4 transition-colors hover:border-white/30"
        >
          <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-secondary">
            {upcoming.posterUrl && <Image src={upcoming.posterUrl} alt="" fill sizes="64px" className="object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider" style={{ color: accent }}>
              <Radio className="h-3 w-3" /> Next show
            </p>
            <p className="truncate text-xl font-black italic uppercase tracking-tight group-hover:text-primary">{upcoming.title}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {new Date(upcoming.date).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              {upcoming.city ? ` · ${upcoming.city}` : ""}
            </p>
          </div>
          <span className="hidden items-center gap-1.5 border px-3 py-2 text-[11px] font-bold uppercase tracking-wider sm:flex" style={{ borderColor: accent, color: accent }}>
            <Target className="h-3.5 w-3.5" /> Predict
          </span>
        </Link>
      )}

      {champions.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
            <Crown className="h-4 w-4" /> Current Champions
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {champions.map((c) => (
              <Link
                key={c.id}
                href="/champions"
                className="group flex flex-col items-center gap-3 border border-white/10 bg-slate-950/50 p-4 text-center transition-colors hover:border-white/30"
              >
                <BeltArt style={c.style} label={c.shortName ?? c.title} name={c.title} height={52} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{c.shortName ?? c.title}</p>
                  <p className="truncate text-sm font-bold uppercase group-hover:text-primary">
                    {c.champions.map((p) => p.name).join(" & ")}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {topPredictors.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: accent }}>
            <Target className="h-4 w-4" /> Top {promotion.shortName} Predictors
          </div>
          <ol className="divide-y divide-white/5 border border-white/10 bg-card/85">
            {topPredictors.map((p, i) => (
              <li key={p.user.id}>
                <Link href={`/users/${p.user.slug || p.user.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
                  <span className="w-5 text-center text-sm font-bold tabular-nums text-muted-foreground">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold uppercase ">{p.user.name ?? "Member"}</span>
                  <span className="text-xs font-bold tabular-nums text-muted-foreground">{p.right}/{p.total}</span>
                  <span className="w-12 text-right text-sm font-bold tabular-nums" style={{ color: accent }}>{Math.round((p.right / p.total) * 100)}%</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {championships.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase tracking-wider text-xs">
            <Trophy className="w-4 h-4" /> Championship Belts
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {championships.map((belt) => (
              <div
                key={belt.id}
                className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800 flex items-center justify-between"
              >
                <span className="text-xs font-bold text-white">{belt.title}</span>
                {belt.shortName && (
                  <span className="text-[11px] font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-400/10 rounded">
                    {belt.shortName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recent.map((event) => {
          const avgRating = event.reviews.length
            ? event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length
            : 0;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group rounded-[2rem] border border-white/5 bg-card/85 overflow-hidden hover:border-primary/30 transition-colors"
            >
              <div className="relative aspect-[2/3]">
                {event.posterUrl ? (
                  <Image src={event.posterUrl} alt={event.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,#020617_0%,#111827_100%)]" />
                )}
              </div>
              <div className="p-5 space-y-3">
                <h2 className="font-semibold italic uppercase tracking-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {event.title}
                </h2>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {new Date(event.date).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  {avgRating > 0 ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-primary fill-current" />
                      {avgRating.toFixed(2)}
                    </span>
                  ) : null}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
