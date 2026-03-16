"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { RANKS, RANK_WEIGHTS, calcRankScore, getRank } from "@lib/ranks";

interface RankBadgeProps {
  ratings: number;
  reviews: number;
  predictions: number;
}

export default function RankBadge({ ratings, reviews, predictions }: RankBadgeProps) {
  const [open, setOpen] = useState(false);
  const score = calcRankScore(ratings, reviews, predictions);
  const rank = getRank(score);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1] ?? null;
  const progress = nextRank
    ? Math.min(100, Math.round(((score - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-3 py-1 shadow-lg hover:scale-105 transition-transform ${rank.color}`}
      >
        <Award className="w-3 h-3" />
        <span className="text-[10px] font-black italic uppercase tracking-widest whitespace-nowrap">{rank.name}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-0 z-40 w-72 bg-card border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
            <div className="absolute -top-1.5 left-6 w-3 h-3 bg-card border-l border-t border-white/10 rotate-45" />

            {/* Rank name + flavour */}
            <div className="space-y-0.5">
              <p className={`text-sm font-black italic uppercase tracking-widest ${rank.color}`}>{rank.name}</p>
              <p className="text-xs text-muted-foreground">{rank.desc}</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>{score} pts</span>
                {nextRank && <span>Next: {nextRank.name} ({nextRank.min} pts)</span>}
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-current ${rank.color} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {nextRank ? (
                <p className="text-[10px] text-muted-foreground">
                  {nextRank.min - score} more points to reach <span className="font-bold text-foreground">{nextRank.name}</span>
                </p>
              ) : (
                <p className="text-[10px] text-primary font-bold">Maximum rank achieved.</p>
              )}
            </div>

            {/* Breakdown */}
            <div className="border-t border-white/5 pt-3 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Your score breakdown</p>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Match ratings</span>
                <span className="font-bold text-foreground">{ratings} × {RANK_WEIGHTS.rating} = <span className="text-primary">{ratings * RANK_WEIGHTS.rating} pts</span></span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Reviews written</span>
                <span className="font-bold text-foreground">{reviews} × {RANK_WEIGHTS.review} = <span className="text-primary">{reviews * RANK_WEIGHTS.review} pts</span></span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Predictions made</span>
                <span className="font-bold text-foreground">{predictions} × {RANK_WEIGHTS.prediction} = <span className="text-primary">{predictions * RANK_WEIGHTS.prediction} pts</span></span>
              </div>
            </div>

            {/* How it works note */}
            <div className="border-t border-white/5 pt-2">
              <p className="text-[10px] text-muted-foreground/60 leading-relaxed">
                Rate matches, write reviews, and make predictions to earn points and climb the ranks.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
