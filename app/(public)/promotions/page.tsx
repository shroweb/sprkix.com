import { prisma } from "@lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Star, Trophy, Calendar, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PromotionsPage() {
  const events = await prisma.event.findMany({
    include: {
      reviews: { select: { rating: true } },
    },
    orderBy: { date: "desc" },
  });

  // Group by promotion
  type PromotionData = {
    name: string;
    eventCount: number;
    avgRating: number | null;
    latestDate: Date | string;
    latestPoster: string | null;
    latestSlug: string;
    posters: (string | null)[];
    reviewCount: number;
  };

  const promotionMap: Record<string, PromotionData> = {};

  for (const event of events) {
    if (!promotionMap[event.promotion]) {
      promotionMap[event.promotion] = {
        name: event.promotion,
        eventCount: 0,
        avgRating: null,
        latestDate: event.date,
        latestPoster: event.posterUrl,
        latestSlug: event.slug,
        posters: [],
        reviewCount: 0,
      };
    }

    const promo = promotionMap[event.promotion];
    promo.eventCount++;
    promo.reviewCount += event.reviews.length;
    if (event.posterUrl && promo.posters.length < 4) {
      promo.posters.push(event.posterUrl);
    }

    // Update latest
    if (new Date(event.date) > new Date(promo.latestDate)) {
      promo.latestDate = event.date;
      promo.latestPoster = event.posterUrl;
      promo.latestSlug = event.slug;
    }
  }

  // Compute avg ratings per promotion
  for (const promo of Object.values(promotionMap)) {
    const promoEvents = events.filter((e) => e.promotion === promo.name);
    const allRatings = promoEvents.flatMap((e) =>
      e.reviews.map((r) => r.rating),
    );
    promo.avgRating = allRatings.length
      ? parseFloat(
          (allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(
            2,
          ),
        )
      : null;
  }

  const promotions = Object.values(promotionMap).sort(
    (a, b) => b.eventCount - a.eventCount,
  );

  return (
    <div className="max-w-7xl mx-auto px-6 pb-20 space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
            Browse By
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
          Promotions
        </h1>
        <p className="text-muted-foreground font-medium italic">
          {promotions.length} promotions · {events.length} archived events
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {promotions.map((promo) => (
          <Link
            key={promo.name}
            href={`/events?promotion=${encodeURIComponent(promo.name)}`}
            className="group bg-card/40 border border-white/5 rounded-[2rem] p-6 hover:border-primary/30 hover:bg-card/60 transition-all space-y-5"
          >
            {/* Poster collage */}
            <div className="flex gap-2 h-28">
              {promo.posters.slice(0, 4).map((poster, idx) => (
                <div
                  key={idx}
                  className={`relative rounded-xl overflow-hidden border border-white/5 flex-1 ${idx === 0 ? "flex-[2]" : ""}`}
                >
                  <Image
                    src={poster || "/placeholder.png"}
                    alt=""
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
              ))}
              {promo.posters.length === 0 && (
                <div className="flex-1 rounded-xl bg-secondary/50 flex items-center justify-center">
                  <Trophy className="w-8 h-8 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="space-y-3">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter group-hover:text-primary transition-colors">
                  {promo.name}
                </h2>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span className="font-bold">{promo.eventCount}</span>
                  <span className="font-medium">events</span>
                </div>

                {promo.avgRating !== null && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="w-3.5 h-3.5 text-primary fill-current" />
                    <span className="font-black text-foreground">
                      {promo.avgRating}
                    </span>
                    <span className="text-[10px] font-bold">
                      ({promo.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Latest:{" "}
                {new Date(promo.latestDate).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </div>
            </div>

            <div className="text-xs font-black uppercase tracking-widest text-primary group-hover:gap-2 flex items-center gap-1.5 transition-all">
              View All Events
              <svg
                className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
