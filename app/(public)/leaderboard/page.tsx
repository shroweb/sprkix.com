import { getLeaderboard } from "@lib/cached-data";
import { parsePeriod, LEADERBOARD_PERIODS } from "@lib/leaderboard";
import { getSiteUrl } from "@lib/seo";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import Image from "next/image";
import { Target, Trophy, ChevronLeft, Crown } from "lucide-react";
import type { Metadata } from "next";

import { prisma } from "@lib/prisma";

export const metadata: Metadata = {
  title: "Prediction Leaderboard",
  description: "The most accurate wrestling event predictors on Poison Rana.",
  alternates: { canonical: `${getSiteUrl()}/leaderboard` },
};

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const period = parsePeriod(sp.period);
  const following = sp.scope === "following";
  const [currentUser, entries] = await Promise.all([
    getUserFromServerCookie(),
    getLeaderboard(period),
  ]);

  let circle: Set<string> | null = null;
  if (following && currentUser) {
    const rows = await prisma.follow.findMany({ where: { followerId: currentUser.id }, select: { followingId: true } });
    circle = new Set([currentUser.id, ...rows.map((r) => r.followingId)]);
  }
  const href = (p: string, scope: string) => {
    const q = new URLSearchParams();
    if (p !== "all") q.set("period", p);
    if (scope === "following") q.set("scope", "following");
    const qs = q.toString();
    return qs ? `/leaderboard?${qs}` : "/leaderboard";
  };

  const ranked = entries.filter((e) => !circle || circle.has(e.userId)).map((e) => ({
    id: e.userId,
    name: e.name,
    slug: e.slug,
    avatarUrl: e.avatarUrl,
    predictionScore: e.correct,
    predictionCount: e.total,
    accuracy: e.accuracy,
    streak: e.streak,
  }));

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
            <span className="text-xs font-bold uppercase tracking-wider text-primary ">Community</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
            Prediction<br />Leaderboard
          </h1>
          <p className="text-muted-foreground font-medium max-w-xl">
            Ranked by accuracy across resolved match predictions for the selected period. Minimum 3 predictions to qualify. Updated every few minutes.
          </p>
        </div>

        <div className="mb-3 flex gap-2" role="tablist" aria-label="Leaderboard scope">
          {[
            { id: "all", label: "Everyone" },
            { id: "following", label: "Following" },
          ].map((t) => (
            <Link
              key={t.id}
              href={href(period, t.id)}
              role="tab"
              aria-selected={(t.id === "following") === following}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border transition-colors ${
                (t.id === "following") === following ? "bg-white text-black border-white" : "border-white/10 text-muted-foreground hover:text-white hover:border-white/30"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
        {following && !currentUser && (
          <p className="mb-6 text-sm text-muted-foreground"><Link href="/login" className="font-bold text-primary underline">Sign in</Link> to see just the people you follow.</p>
        )}

        <div className="flex gap-2 mb-8" role="tablist" aria-label="Leaderboard period">
          {LEADERBOARD_PERIODS.map((p) => (
            <Link
              key={p.id}
              href={href(p.id, following ? "following" : "all")}
              role="tab"
              aria-selected={p.id === period}
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${
                p.id === period
                  ? "bg-primary text-black border-primary"
                  : "border-white/10 text-muted-foreground hover:text-primary hover:border-primary/40"
              }`}
            >
              {p.label}
            </Link>
          ))}
        </div>

        {ranked.length >= 3 && (
          <div className="mb-10 grid grid-cols-3 items-end gap-2 sm:gap-4">
            {[1, 0, 2].map((i) => {
              const e = ranked[i];
              const h = i === 0 ? "h-44" : i === 1 ? "h-36" : "h-28";
              const tone = i === 0 ? "from-yellow-400/30 border-yellow-400/40" : i === 1 ? "from-slate-300/20 border-slate-300/30" : "from-orange-500/20 border-orange-500/30";
              return (
                <Link key={e.id} href={`/users/${e.slug}`} className="group flex flex-col items-center gap-2 text-center">
                  <div className="relative h-14 w-14 overflow-hidden border border-white/20 bg-secondary sm:h-20 sm:w-20">
                    {e.avatarUrl ? (
                      <Image src={e.avatarUrl} alt="" fill sizes="80px" className="object-cover" />
                    ) : (
                      <span className="grid h-full w-full place-items-center text-xl font-black text-muted-foreground">{e.name?.charAt(0).toUpperCase() || "?"}</span>
                    )}
                  </div>
                  <p className="max-w-full truncate text-xs font-bold uppercase group-hover:text-primary sm:text-sm">{e.name}</p>
                  <div className={`flex w-full flex-col items-center justify-start gap-1 border-t-2 bg-gradient-to-b to-transparent pt-3 ${h} ${tone}`}>
                    <span className="text-3xl">{medals[i]}</span>
                    <span className="text-lg font-black tabular-nums">{e.accuracy}%</span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{e.predictionScore}/{e.predictionCount}</span>
                    {e.streak >= 2 && <span className="text-[11px] font-bold text-orange-400">🔥 {e.streak}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
        {ranked.length === 0 ? (
          <div className="bg-card/85 border border-dashed border-white/10 rounded-[2.5rem] p-8 sm:p-20 text-center space-y-4">
            <Target className="w-16 h-16 text-white/10 mx-auto" />
            <p className="text-white/75 font-black italic text-xl uppercase tracking-tighter">
              No predictions resolved yet.
            </p>
            <p className="text-muted-foreground text-sm">
              The leaderboard fills up once match results are set after events.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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
                      : "bg-card/85 border-white/5 hover:border-white/15 hover:bg-card/60"
                  }`}
                >
                  {/* Rank */}
                  <div className="w-12 text-center shrink-0">
                    {isMedal ? (
                      <span className="text-2xl">{medals[idx]}</span>
                    ) : (
                      <span className={`text-lg font-black italic ${isCurrentUser ? "text-primary" : "text-muted-foreground/80"}`}>
                        #{idx + 1}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full overflow-hidden border shrink-0 flex items-center justify-center font-bold text-sm ${
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
                    <p className={`font-bold uppercase tracking-tight text-sm group-hover:text-primary transition-colors ${isCurrentUser ? "text-primary" : ""}`}>
                      {entry.name}
                      {isCurrentUser && <span className="ml-2 text-[11px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold not-italic uppercase tracking-wider">You</span>}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                      {entry.predictionScore} correct of {entry.predictionCount}
                      {entry.streak >= 2 && (
                        <span className="ml-1.5 text-orange-400">🔥 {entry.streak} streak</span>
                      )}
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
                    <span className={`text-sm font-bold ${
                      entry.accuracy >= 70 ? "text-emerald-400" :
                      entry.accuracy >= 50 ? "text-primary" : "text-orange-400"
                    }`}>
                      {entry.accuracy}%
                    </span>
                  </div>

                  {/* Mobile accuracy */}
                  <span className={`sm:hidden text-sm font-bold shrink-0 ${
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

      {currentUserRank >= 0 && ranked[currentUserRank] && (
        <div className="sticky bottom-20 z-30 mx-auto mt-6 max-w-4xl px-4 sm:px-6 md:bottom-4">
          <div className="flex items-center gap-4 border border-primary/40 bg-slate-950/95 px-4 py-3 shadow-2xl backdrop-blur-xl">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">Your rank</span>
            <span className="text-2xl font-black italic text-primary">#{currentUserRank + 1}</span>
            <span className="min-w-0 truncate text-sm font-bold text-muted-foreground">
              {ranked[currentUserRank].accuracy}% · {ranked[currentUserRank].predictionScore}/{ranked[currentUserRank].predictionCount} correct
              {ranked[currentUserRank].streak >= 2 ? ` · 🔥 ${ranked[currentUserRank].streak}` : ""}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
