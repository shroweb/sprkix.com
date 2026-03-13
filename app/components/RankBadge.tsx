"use client";

import { useState } from "react";
import { Award } from "lucide-react";

export const RANKS = [
  { name: "Local Talent",       min: 0,   max: 4,   color: "text-zinc-500",    desc: "You just showed up. Welcome to the card." },
  { name: "Jobber",             min: 5,   max: 14,  color: "text-zinc-400",    desc: "Taking the losses so the business can run." },
  { name: "Curtain Jerker",     min: 15,  max: 29,  color: "text-slate-400",   desc: "Opening the show. The crowd is still finding seats." },
  { name: "Mid-Carder",         min: 30,  max: 49,  color: "text-blue-400",    desc: "A solid presence. The backbone of any roster." },
  { name: "Upper Mid-Carder",   min: 50,  max: 74,  color: "text-violet-400",  desc: "Always in the mix. Championship shot incoming." },
  { name: "Main Eventer",       min: 75,  max: 99,  color: "text-amber-400",   desc: "The lights shine brightest on you." },
  { name: "Champion",           min: 100, max: 149, color: "text-yellow-400",  desc: "Title around your waist. Undisputed." },
  { name: "Legend",             min: 150, max: 224, color: "text-primary",     desc: "Your name alone sells tickets." },
  { name: "Icon",               min: 225, max: 324, color: "text-primary",     desc: "Immortalised. The business is better because of you." },
  { name: "Hall of Famer",      min: 325, max: Infinity, color: "text-primary", desc: "The highest honour. Your plaque is in the rafters." },
];

export function getRank(total: number) {
  return RANKS.find(r => total >= r.min && total <= r.max) ?? RANKS[0];
}

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
