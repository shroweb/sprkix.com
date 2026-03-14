import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import Image from "next/image";
import { Target, Trophy, ChevronLeft, Crown } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Prediction Leaderboard | Poison Rana",
  description: "The most accurate wrestling event predictors on Poison Rana.",
};

export default async function LeaderboardPage() {
  const currentUser = await getUserFromServerCookie();

  // Fetch all predictions on matches that have at least one declared winner.
  // We compute correctness ourselves so the leaderboard works even when the
  // denormalized predictionScore / predictionCount fields are stale (e.g. results
  // saved via the edit route rather than the Quick Results endpoint).
  const rawPredictions = await prisma.prediction.findMany({
    where: {
      match: { participants: { some: { isWinner: true } } },
      predictedWinnerId: { not: null },
    },
    select: {
      userId: true,
      predictedWinnerId: true,
      isCorrect: true,
      match: {
        select: {
          participants: {
            where: { isWinner: true },
            select: { wrestlerId: true },
          },
        },
      },
    },
  });

  // Per-user tallies
  const tallies: Record<string, { correct: number; total: number }> = {};
  for (const p of rawPredictions) {
    if (!tallies[p.userId]) tallies[p.userId] = { correct: 0, total: 0 };
    tallies[p.userId].total++;
    // Prefer stored isCorrect; fall back to live computation
    const isCorrect =
      p.isCorrect !== null
        ? p.isCorrect
        : p.match.participants.some((mp) => mp.wrestlerId === p.predictedWinnerId);
    if (isCorrect) tallies[p.userId].correct++;
  }

  // Keep only users with ≥3 resolved predictions
  const qualifiedIds = Object.entries(tallies)
    .filter(([, t]) => t.total >= 3)
    .map(([id]) => id);

  const userProfiles =
    qualifiedIds.length > 0
      ? await prisma.user.findMany({
          where: { id: { in: qualifiedIds } },
          select: { id: true, name: true, slug: true, avatarUrl: true },
        })
      : [];

  // Sort by accuracy % then by volume
  const ranked = userProfiles
    .map((u) => {
      const t = tallies[u.id];
      return {
        ...u,
        predictionScore: t.correct,
        predictionCount: t.total,
        accuracy: Math.round((t.correct / t.total) * 100),
      };
    })
    .sort((a, b) => b.accuracy - a.accuracy || b.predictionCount - a.predictionCount)
    .slice(0, 50);

  const currentUserRank = currentUser
    ? ranked.findIndex((u) => u.id === currentUser.id)
    : -1;

  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 relative z-10">
        {/* Back */}
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Events
        </Link>

        {/* Header */}
        <div className="space-y-4 mb-12">
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-8 bg-primary" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">Community</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
            Prediction<br />Leaderboard
          </h1>
          <p className="text-muted-foreground font-medium italic max-w-xl">
            Ranked by accuracy across all resolved match predictions. Minimum 3 predictions to qualify.
          </p>
        </div>

        {ranked.length === 0 ? (
          <div className="bg-card/30 border border-dashed border-white/10 rounded-[2.5rem] p-20 text-center space-y-4">
            <Target className="w-16 h-16 text-white/10 mx-auto" />
            <p className="text-white/40 font-black italic text-xl uppercase tracking-tighter">
              No predictions resolved yet.
            </p>
            <p className="text-muted-foreground text-sm">
              The leaderboard fills up once match results are set after events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Current user callout if they're ranked */}
            {currentUserRank > 2 && ranked[currentUserRank] && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-4">
                <span className="text-xs font-black text-primary uppercase tracking-widest">Your rank</span>
                <span className="text-2xl font-black italic text-primary">#{currentUserRank + 1}</span>
                <span className="text-sm font-bold text-muted-foreground">
                  {ranked[currentUserRank].accuracy}% accuracy · {ranked[currentUserRank].predictionScore}/{ranked[currentUserRank].predictionCount} correct
                </span>
              </div>
            )}

            {ranked.map((entry, idx) => {
              const isCurrentUser = entry.id === currentUser?.id;
              const isMedal = idx < 3;

              return (
                <Link
                  key={entry.id}
                  href={`/users/${entry.slug}`}
                  className={`flex items-center gap-5 p-5 rounded-[2rem] border transition-all group ${
                    isCurrentUser
                      ? "bg-primary/10 border-primary/30 hover:border-primary/50"
                      : idx === 0
                      ? "bg-yellow-400/5 border-yellow-400/20 hover:border-yellow-400/40"
                      : "bg-card/40 border-white/5 hover:border-white/15 hover:bg-card/60"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 text-center shrink-0">
                    {isMedal ? (
                      <span className="text-2xl">{medals[idx]}</span>
                    ) : (
                      <span className={`text-lg font-black italic ${isCurrentUser ? "text-primary" : "text-muted-foreground/50"}`}>
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full overflow-hidden border shrink-0 flex items-center justify-center font-black text-sm ${
                    idx === 0 ? "border-yellow-400/40 bg-yellow-400/10" : "border-white/10 bg-secondary"
                  }`}>
                    {entry.avatarUrl ? (
                      <Image src={entry.avatarUrl} alt={entry.name || ""} width={40} height={40} className="object-cover" />
                    ) : (
                      <span className={idx === 0 ? "text-yellow-400" : "text-muted-foreground"}>
                        {entry.name?.charAt(0).toUpperCase() || "?"}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors ${isCurrentUser ? "text-primary" : ""}`}>
                      {entry.name}
                      {isCurrentUser && <span className="ml-2 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black not-italic uppercase tracking-wider">You</span>}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider">
                      {entry.predictionScore} correct of {entry.predictionCount}
                    </p>
                  </div>

                  {/* Accuracy bar */}
                  <div className="hidden sm:flex flex-col items-end gap-1.5 shrink-0 w-28">
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          entry.accuracy >= 70 ? "bg-emerald-400" :
                          entry.accuracy >= 50 ? "bg-primary" : "bg-orange-400"
                        }`}
                        style={{ width: `${entry.accuracy}%` }}
                      />
                    </div>
                    <span className={`text-sm font-black italic ${
                      entry.accuracy >= 70 ? "text-emerald-400" :
                      entry.accuracy >= 50 ? "text-primary" : "text-orange-400"
                    }`}>
                      {entry.accuracy}%
                    </span>
                  </div>

                  {/* Mobile accuracy */}
                  <span className={`sm:hidden text-sm font-black italic shrink-0 ${
                    entry.accuracy >= 70 ? "text-emerald-400" :
                    entry.accuracy >= 50 ? "text-primary" : "text-orange-400"
                  }`}>
                    {entry.accuracy}%
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
