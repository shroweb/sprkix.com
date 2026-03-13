"use client";

import { useState } from "react";
import { Award } from "lucide-react";
import { RANKS, getRank } from "@lib/ranks";

export default function RankBadge({ totalActivity }: { totalActivity: number }) {
  const [open, setOpen] = useState(false);
  const rank = getRank(totalActivity);
  const nextRank = RANKS[RANKS.indexOf(rank) + 1] ?? null;
  const progress = nextRank
    ? Math.min(100, Math.round(((totalActivity - rank.min) / (nextRank.min - rank.min)) * 100))
    : 100;

  return (
    <div className="absolute -bottom-3 -right-3 z-20">
      {/* Badge pill */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`flex items-center gap-2 bg-background/80 backdrop-blur-md border border-white/10 rounded-full px-4 py-1.5 shadow-2xl hover:scale-105 transition-transform ${rank.color} w-max max-w-none`}
      >
        <Award className="w-3.5 h-3.5" />
        <span className="text-[7px] font-black uppercase tracking-[0.2em] whitespace-nowrap">{rank.name}</span>
      </button>

      {/* Tooltip popup */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-40 w-64 bg-card border border-white/10 rounded-2xl p-4 shadow-2xl space-y-3">
            {/* Arrow */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-card border-r border-b border-white/10 rotate-45" />

            <div className="space-y-1">
              <p className={`text-sm font-black italic uppercase tracking-widest ${rank.color}`}>{rank.name}</p>
              <p className="text-xs text-muted-foreground">{rank.desc}</p>
            </div>

            <div className="border-t border-white/5 pt-3 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <span>{totalActivity} ratings &amp; reviews</span>
                {nextRank && <span>Next: {nextRank.name}</span>}
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-current ${rank.color} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {nextRank ? (
                <p className="text-[10px] text-muted-foreground">
                  {nextRank.min - totalActivity} more to reach <span className="font-bold text-foreground">{nextRank.name}</span>
                </p>
              ) : (
                <p className="text-[10px] text-primary font-bold">Maximum rank achieved. 🏆</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
