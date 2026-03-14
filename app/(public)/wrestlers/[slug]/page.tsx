import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Calendar,
  Swords,
  TrendingUp,
  UserCircle,
  Star,
} from "lucide-react";
import BioExpand from "./BioExpand";

export default async function WrestlerPage({ params }: { params: any }) {
  const { slug } = await params;
  const wrestler = await prisma.wrestler.findUnique({
    where: { slug },
    include: {
      matches: {
        include: {
          match: {
            include: {
              event: { select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
              participants: { include: { wrestler: true } },
              ratings: { select: { rating: true } },
            },
          },
        },
        orderBy: { match: { event: { date: "desc" } } },
      },
    },
  });

  if (!wrestler) return notFound();

  const totalMatches = wrestler.matches.length;
  const wins = wrestler.matches.filter((mp) => mp.isWinner).length;
  const losses = totalMatches - wins;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const uniqueEvents = new Set(wrestler.matches.map((mp) => mp.match.event.id))
    .size;

  // Compute average match rating this wrestler has appeared in
  const ratedMatches = wrestler.matches
    .map((mp) => {
      const ratings = mp.match.ratings;
      if (!ratings.length) return null;
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      return { ...mp, avgRating: parseFloat(avg.toFixed(2)) };
    })
    .filter(Boolean) as ((typeof wrestler.matches)[0] & {
    avgRating: number;
  })[];

  const overallAvgRating = ratedMatches.length
    ? parseFloat(
        (
          ratedMatches.reduce((s, m) => s + m.avgRating, 0) /
          ratedMatches.length
        ).toFixed(2),
      )
    : null;

  // Top 3 highest rated matches
  const topMatches = [...ratedMatches]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 3);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero */}
      <div className="relative rounded-[3rem] overflow-hidden">
        {wrestler.imageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={wrestler.imageUrl}
              alt={wrestler.name}
              fill
              className="object-cover blur-[80px] opacity-20 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 p-5 sm:p-8 md:p-10">
          <div className="relative w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 shrink-0">
            {wrestler.imageUrl ? (
              <Image
                src={wrestler.imageUrl}
                alt={wrestler.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <UserCircle className="w-20 h-20 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-2">
                Wrestler Profile
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                {wrestler.name}
              </h1>
            </div>

            {/* Career Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black text-emerald-400">{wins}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Wins
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black text-red-400">{losses}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Losses
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black">{totalMatches}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Matches
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black">{uniqueEvents}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                  Events
                </p>
              </div>
              {overallAvgRating && (
                <div className="bg-card/60 backdrop-blur-md border border-primary/20 rounded-2xl px-6 py-4 text-center ring-1 ring-primary/20">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <p className="text-3xl font-black text-primary">
                      {overallAvgRating}
                    </p>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
                    Career Avg
                  </p>
                </div>
              )}
            </div>

            {/* Win rate bar */}
            {totalMatches > 0 && (
              <div className="max-w-xs space-y-1.5">
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  <span>Win Rate</span>
                  <span className="text-foreground">{winRate}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            )}

            {wrestler.bio && <BioExpand bio={wrestler.bio} />}
          </div>
        </div>
      </div>

      {/* Top Rated Matches */}
      {topMatches.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter">
              Top Rated Matches
            </h2>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {topMatches.map((mp, i) => (
              <Link
                key={mp.match.id}
                href={`/events/${mp.match.event.slug}`}
                className="group relative bg-card/40 border border-white/5 hover:border-primary/30 rounded-[2rem] p-8 transition-all space-y-4 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Trophy className="w-16 h-16 text-primary" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black italic text-primary">
                      {mp.avgRating.toFixed(2)}
                    </span>
                    <Star className="w-5 h-5 text-primary fill-current" />
                  </div>
                  {mp.isWinner && (
                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full">
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Victor</span>
                    </div>
                  )}
                </div>
                <p className="font-black text-lg italic uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2 relative z-10">
                  {mp.match.title}
                </p>
                <div className="pt-4 border-t border-white/5 relative z-10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                    {mp.match.event.title.replace(/–\s*\d{4}.*$/, "").trim()}
                    </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Match History */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-black uppercase italic tracking-tighter">
            Match History
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {totalMatches} Bouts
          </span>
        </div>

        {wrestler.matches.length > 0 ? (
          <div className="space-y-3">
            {wrestler.matches.map((mp) => {
              const matchAvgRating = mp.match.ratings.length
                ? parseFloat(
                    (
                      mp.match.ratings.reduce((s, r) => s + r.rating, 0) /
                      mp.match.ratings.length
                    ).toFixed(1),
                  )
                : null;

              // Strip any HTML from the DB value before re-injecting to prevent XSS
              const rawResult = (mp.match.result || "No result recorded").replace(/<[^>]*>/g, "");
              let resultText = rawResult;
              mp.match.participants.forEach(({ wrestler: w }) => {
                const escaped = w.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
                // Escape wrestler names before injecting into HTML
                const safeName = w.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                resultText = resultText.replace(
                  new RegExp(`\\b${escaped}\\b`, "g"),
                  w.slug === wrestler.slug ? `<strong>${safeName}</strong>` : safeName,
                );
              });

              return (
                <div
                  key={mp.match.id}
                  className={`bg-card/40 border rounded-2xl p-5 flex items-center gap-5 transition-colors hover:bg-card/60 ${mp.isWinner ? "border-emerald-500/20" : "border-white/5"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mp.isWinner ? "bg-emerald-500/10" : "bg-secondary"}`}
                  >
                    {mp.isWinner ? (
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Swords className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <Link
                        href={`/events/${mp.match.event.slug}`}
                        className="font-black text-sm uppercase italic tracking-tight hover:text-primary transition-colors truncate"
                      >
                        {mp.match.event.title
                          .replace(/–\s*\d{4}.*$/, "")
                          .trim()}
                      </Link>
                      {mp.match.title && (
                        <span className="text-[9px] font-black uppercase tracking-widest bg-secondary px-2 py-0.5 rounded text-muted-foreground shrink-0">
                          {mp.match.title}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm text-muted-foreground font-medium italic"
                      dangerouslySetInnerHTML={{ __html: resultText }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {matchAvgRating && (
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-black">
                          {matchAvgRating}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="w-3 h-3 text-primary" />
                      {new Date(mp.match.event.date).getFullYear()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold italic">
              No matches logged for this competitor yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
