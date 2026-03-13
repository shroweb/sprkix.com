import { prisma } from "@lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Star, Clock, Trophy, Swords, ChevronLeft } from "lucide-react";

export const dynamic = "force-dynamic";

function secsToMmss(secs: number | null | undefined): string {
  if (!secs) return "?";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default async function TopMatchesPage() {
  const allMatches = await prisma.match.findMany({
    include: {
      ratings: { select: { rating: true } },
      participants: {
        include: {
          wrestler: { select: { name: true, slug: true, imageUrl: true } },
        },
        orderBy: { team: "asc" },
      },
      event: {
        select: {
          title: true,
          slug: true,
          posterUrl: true,
          promotion: true,
          date: true,
        },
      },
    },
  });

  // Rank by avg rating, min 1 rating
  const ranked = allMatches
    .filter((m) => m.ratings.length > 0)
    .map((m) => {
      const rats = m.ratings.map((r) => r.rating);
      const avg = rats.reduce((a, b) => a + b, 0) / rats.length;
      return {
        ...m,
        avgRating: parseFloat(avg.toFixed(2)),
        ratingCount: rats.length,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating || b.ratingCount - a.ratingCount)
    .slice(0, 100);

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  const medalColor = (i: number) =>
    i === 0
      ? "text-yellow-400 bg-yellow-400/10 border-yellow-400/30"
      : i === 1
        ? "text-slate-300 bg-slate-300/10 border-slate-300/30"
        : "text-amber-600 bg-amber-600/10 border-amber-600/30";

  const getTeams = (participants: (typeof ranked)[0]["participants"]) => {
    const teams: Record<number, typeof participants> = {};
    participants.forEach((p) => {
      const t = p.team ?? 1;
      if (!teams[t]) teams[t] = [];
      teams[t].push(p);
    });
    return Object.values(teams);
  };

  const ParticipantNames = ({ match }: { match: (typeof ranked)[0] }) => {
    const teams = getTeams(match.participants);
    return (
      <div className="flex flex-wrap items-center gap-1.5 text-sm font-bold">
        {teams.map((team, ti) => (
          <span key={ti} className="flex items-center gap-1.5">
            {ti > 0 && (
              <span className="text-[10px] font-black text-muted-foreground uppercase px-1">
                vs
              </span>
            )}
            {team.map((p, pi) => (
              <span key={p.wrestler.slug} className="flex items-center gap-1">
                {pi > 0 && (
                  <span className="text-muted-foreground/50 text-xs">
                    &amp;
                  </span>
                )}
                <Link
                  href={`/wrestlers/${p.wrestler.slug}`}
                  className="hover:text-primary transition-colors"
                >
                  {p.wrestler.name}
                </Link>
              </span>
            ))}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8 sm:space-y-12">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group mb-6"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
              Community Rated
            </span>
          </div>
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase italic leading-none">
            Top Matches
          </h1>
          <p className="text-muted-foreground font-medium italic">
            The {ranked.length} highest-rated matches as judged by the
            community.
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
          <Swords className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold italic">
            No match ratings yet. Start rating matches on event pages!
          </p>
        </div>
      ) : (
        <>
          {/* Top 3 podium cards */}
          {top3.length > 0 && (
            <div className="grid md:grid-cols-3 gap-5">
              {top3.map((match, i) => (
                <div
                  key={match.id}
                  className="group relative bg-card/40 border border-white/5 rounded-[2rem] overflow-hidden hover:border-primary/30 transition-all"
                >
                  {/* Event poster bg */}
                  {match.event.posterUrl && (
                    <div className="absolute inset-0 z-0">
                      <Image
                        src={match.event.posterUrl}
                        alt=""
                        fill
                        className="object-cover opacity-10 blur-xl scale-110"
                      />
                    </div>
                  )}
                  <div className="relative z-10 p-6 space-y-4">
                    {/* Rank badge */}
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-black uppercase tracking-wider ${medalColor(i)}`}
                    >
                      <Trophy className="w-3.5 h-3.5 fill-current" />#{i + 1}
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, s) => (
                        <Star
                          key={s}
                          className={`w-4 h-4 ${s < Math.round(match.avgRating) ? "fill-current text-primary" : "text-muted-foreground/20"}`}
                        />
                      ))}
                      <span className="text-2xl font-black italic ml-1">
                        {match.avgRating.toFixed(2)}
                      </span>
                      <span className="text-xs text-muted-foreground font-bold">
                        ({match.ratingCount})
                      </span>
                    </div>

                    {/* Match info */}
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-primary">
                        {match.type}
                      </span>
                      <Link href={`/events/${match.event.slug}`}>
                        <h3 className="font-black italic uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors mt-0.5 hover:underline decoration-primary/50 underline-offset-4">
                          {match.title}
                        </h3>
                      </Link>
                    </div>

                    <ParticipantNames match={match} />

                    {/* Event + duration */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-bold text-muted-foreground">
                      <Link
                        href={`/events/${match.event.slug}`}
                        className="truncate max-w-[160px] hover:text-primary transition-colors"
                      >
                        {match.event.title.replace(/–\s\d{4}.*$/, "")}
                      </Link>
                      {match.duration && (
                        <span className="flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />{" "}
                          {secsToMmss(match.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Rest of the list */}
          {rest.length > 0 && (
            <div className="space-y-2">
              {rest.map((match, i) => (
                <div
                  key={match.id}
                  className="group relative flex items-center gap-5 bg-card/30 border border-white/5 hover:border-primary/20 hover:bg-card/50 rounded-2xl px-6 py-4 transition-all"
                >
                  {/* Rank */}
                  <span className="relative z-10 text-sm font-black text-muted-foreground/40 w-7 text-right shrink-0">
                    #{i + 4}
                  </span>

                  {/* Event poster thumbnail */}
                  {match.event.posterUrl && (
                    <div className="relative z-10 w-8 aspect-[2/3] rounded-lg overflow-hidden shrink-0 border border-white/5">
                      <Image
                        src={match.event.posterUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Info */}
                  <div className="relative z-10 flex-1 min-w-0 space-y-0.5">
                    <Link href={`/events/${match.event.slug}`} className="block">
                      <p className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors truncate">
                        {match.title}
                      </p>
                    </Link>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground">
                      <span className="text-primary/70 uppercase">
                        {match.type}
                      </span>
                      <span>·</span>
                      <Link
                        href={`/events/${match.event.slug}`}
                        className="truncate hover:text-primary transition-colors"
                      >
                        {match.event.title.replace(/–\s\d{4}.*$/, "")}
                      </Link>
                      {match.duration && (
                        <>
                          <span>·</span>
                          <span className="flex items-center gap-0.5 shrink-0">
                            <Clock className="w-2.5 h-2.5" />
                            {secsToMmss(match.duration)}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <ParticipantNames match={match} />
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="relative z-10 flex items-center gap-2 shrink-0">
                    <Star className="w-3.5 h-3.5 text-primary fill-current" />
                    <span className="text-sm font-black">
                      {match.avgRating.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground hidden sm:block">
                      ({match.ratingCount})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
