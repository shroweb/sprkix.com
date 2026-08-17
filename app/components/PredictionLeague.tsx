"use client";

import { Trophy, Flame, Award, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export interface LeagueUser {
  id: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  predictionScore: number;
  predictionCount: number;
  badges?: { id: string; badgeType: string; title: string; icon: string }[];
}

export default function PredictionLeague({
  topPredictors = [],
}: {
  topPredictors: LeagueUser[];
}) {
  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-400/10 border border-amber-400/30 rounded-xl text-amber-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold uppercase italic tracking-tight text-white">
              PPV Prediction League
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              Seasonal Match Outcome Leaderboard
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {topPredictors.slice(0, 5).map((user, idx) => {
          const accuracy =
            user.predictionCount > 0
              ? Math.round((user.predictionScore / user.predictionCount) * 100)
              : 0;

          return (
            <div
              key={user.id}
              className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-xs font-black font-mono text-amber-400">
                  #{idx + 1}
                </span>
                <div className="relative w-9 h-9 rounded-full overflow-hidden bg-slate-800 border border-slate-700">
                  {user.avatarUrl ? (
                    <Image src={user.avatarUrl} fill className="object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-xs text-white/40">
                      {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                </div>
                <div>
                  <Link
                    href={`/users/${user.slug}`}
                    className="text-sm font-bold text-white hover:text-amber-400 transition-colors"
                  >
                    {user.name || "Anonymous User"}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                    <span>{user.predictionScore} Correct Picks</span>
                    <span>•</span>
                    <span>{accuracy}% Accuracy</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {idx === 0 && (
                  <span className="px-2.5 py-1 bg-amber-400/10 border border-amber-400/30 text-amber-400 text-[10px] font-black uppercase rounded-full flex items-center gap-1">
                    <Award className="w-3 h-3" /> Champion
                  </span>
                )}
                {user.predictionScore >= 10 && (
                  <span className="px-2 py-0.5 bg-rose-950/60 border border-rose-800/60 text-rose-300 text-[10px] font-bold rounded-full flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" /> Hot Streak
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
