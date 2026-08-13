"use client";

import { Star } from "lucide-react";

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export default function RatingDistribution({
  ratings = [],
  averageRating,
  totalCount,
}: {
  ratings?: number[];
  averageRating?: number;
  totalCount?: number;
}) {
  const count = totalCount ?? ratings.length;
  const avg =
    averageRating ??
    (count > 0 ? ratings.reduce((a, b) => a + b, 0) / count : 0);

  const breakdown: RatingBreakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  ratings.forEach((r) => {
    const star = Math.min(5, Math.max(1, Math.round(r)));
    breakdown[star as keyof RatingBreakdown]++;
  });

  return (
    <div className="glass-card p-6 flex flex-col md:flex-row items-center gap-6">
      {/* Overall Score */}
      <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-8 text-center min-w-[140px]">
        <span className="text-4xl font-extrabold text-white tracking-tight">
          {avg > 0 ? avg.toFixed(2) : "N/A"}
        </span>
        <div className="flex items-center gap-1 my-1.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${
                i < Math.round(avg) ? "fill-amber-400" : "text-slate-700"
              }`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {count} {count === 1 ? "rating" : "ratings"}
        </span>
      </div>

      {/* Star Breakdown Bars */}
      <div className="flex-1 w-full flex flex-col gap-2">
        {[5, 4, 3, 2, 1].map((stars) => {
          const starCount = breakdown[stars as keyof RatingBreakdown];
          const pct = count > 0 ? Math.round((starCount / count) * 100) : 0;
          return (
            <div key={stars} className="flex items-center gap-3 text-xs">
              <span className="w-8 text-slate-400 font-semibold text-right">
                {stars}★
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-500 rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-10 text-slate-500 font-mono text-right">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
