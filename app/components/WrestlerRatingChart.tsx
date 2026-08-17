"use client";

import { Star } from "lucide-react";

interface MatchRatingEntry {
  year: number;
  avgRating: number;
  matchCount: number;
}

export default function WrestlerRatingChart({
  yearlyStats = [],
}: {
  yearlyStats: MatchRatingEntry[];
}) {
  if (!yearlyStats || yearlyStats.length === 0) return null;

  const maxAvg = 5.0;

  return (
    <div className="glass-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white uppercase italic tracking-tight flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          Career Rating History
        </h3>
        <span className="text-xs text-slate-400 font-semibold">Yearly Average</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-2">
        {yearlyStats.map(({ year, avgRating, matchCount }) => {
          const heightPct = Math.min(100, Math.max(10, (avgRating / maxAvg) * 100));

          return (
            <div
              key={year}
              className="flex flex-col items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-amber-400/40 transition-colors"
            >
              <span className="text-xs font-mono font-bold text-amber-400">
                {avgRating > 0 ? avgRating.toFixed(2) : "N/A"}
              </span>

              <div className="w-full h-24 bg-slate-900 rounded-lg flex items-end p-1 overflow-hidden">
                <div
                  className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-md transition-all duration-500"
                  style={{ height: `${heightPct}%` }}
                />
              </div>

              <span className="text-xs font-bold text-white">{year}</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {matchCount} {matchCount === 1 ? "match" : "matches"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
