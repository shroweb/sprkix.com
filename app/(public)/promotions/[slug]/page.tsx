import { prisma } from "@lib/prisma";
import { getPromotionNewsSlug } from "@lib/news";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Calendar, Star, Trophy } from "lucide-react";

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

  const [events, championships] = await Promise.all([
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
  ]);

  return { promotion, events, championships };
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

  const { promotion, events, championships } = data;
  const promotionName = promotion.fullName || promotion.shortName;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      <Link
        href="/promotions"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Promotions
      </Link>

      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">
          Promotion Archive
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter">
          {promotionName}
        </h1>
        <p className="text-muted-foreground font-medium italic">
          {events.length} archived events
        </p>
      </div>

      {championships.length > 0 && (
        <div className="glass-card p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-black uppercase tracking-wider text-xs">
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
                  <span className="text-[10px] font-mono text-amber-400 font-bold px-2 py-0.5 bg-amber-400/10 rounded">
                    {belt.shortName}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => {
          const avgRating = event.reviews.length
            ? event.reviews.reduce((sum, review) => sum + review.rating, 0) / event.reviews.length
            : 0;
          return (
            <Link
              key={event.id}
              href={`/events/${event.slug}`}
              className="group rounded-[2rem] border border-white/5 bg-card/30 overflow-hidden hover:border-primary/30 transition-colors"
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
