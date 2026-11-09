import { Flame, Target, Medal } from "lucide-react";

export interface TrophyPick {
  correct: boolean;
  promotion: string;
  date: Date | string;
  eventId?: string;
}
export interface TrophyBadge {
  id: string;
  icon: string;
  title: string;
}

/** Pure + exported for tests: current/best streak from picks (any order). */
export function streaks(picks: Pick<TrophyPick, "correct" | "date">[]) {
  const sorted = [...picks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let best = 0;
  let run = 0;
  for (const p of sorted) {
    run = p.correct ? run + 1 : 0;
    best = Math.max(best, run);
  }
  return { current: run, best };
}

export default function TrophyCase({ picks, badges }: { picks: TrophyPick[]; badges: TrophyBadge[] }) {
  if (picks.length === 0 && badges.length === 0) return null;

  const { current, best } = streaks(picks);

  const byPromo = new Map<string, { right: number; total: number }>();
  for (const p of picks) {
    const e = byPromo.get(p.promotion) ?? { right: 0, total: 0 };
    e.total++;
    if (p.correct) e.right++;
    byPromo.set(p.promotion, e);
  }
  const promos = [...byPromo.entries()].filter(([, v]) => v.total >= 2).sort((a, b) => b[1].total - a[1].total).slice(0, 5);

  // Perfect cards: events where every resolved pick was right (min 3 picks)
  const byEvent = new Map<string, boolean[]>();
  for (const p of picks) {
    if (!p.eventId) continue;
    byEvent.set(p.eventId, [...(byEvent.get(p.eventId) ?? []), p.correct]);
  }
  const perfect = [...byEvent.values()].filter((v) => v.length >= 3 && v.every(Boolean)).length;

  // Last 30 picks, oldest → newest, as a streak calendar
  const recent = [...picks].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-30);

  return (
    <section className="space-y-6" aria-label="Trophy case">
      <div className="flex items-center gap-4">
        <h2 className="flex items-center gap-2 text-2xl font-semibold uppercase italic tracking-tighter">
          <Medal className="h-6 w-6 text-primary" /> Trophy case
        </h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-4">
        {[
          { k: "Current streak", v: current, icon: <Flame className={`h-4 w-4 ${current >= 3 ? "text-orange-400" : "text-muted-foreground"}`} /> },
          { k: "Best streak", v: best, icon: <Flame className="h-4 w-4 text-orange-400" /> },
          { k: "Perfect cards", v: perfect, icon: <Target className="h-4 w-4 text-emerald-400" /> },
          { k: "Badges", v: badges.length, icon: <Medal className="h-4 w-4 text-primary" /> },
        ].map((s) => (
          <div key={s.k} className="bg-slate-950 p-4">
            <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.icon}{s.k}</p>
            <p className="mt-1 text-3xl font-black tabular-nums">{s.v}</p>
          </div>
        ))}
      </div>

      {badges.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {badges.map((b) => (
            <span key={b.id} className="inline-flex items-center gap-2 border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-bold uppercase tracking-wider">
              <span className="text-base">{b.icon}</span>{b.title}
            </span>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Last {recent.length} picks</p>
          <div className="flex flex-wrap gap-1" role="img" aria-label="Recent prediction results">
            {recent.map((p, i) => (
              <span key={i} className={`h-4 w-4 ${p.correct ? "bg-emerald-400" : "bg-red-500/60"}`} title={`${p.promotion} · ${p.correct ? "correct" : "missed"}`} />
            ))}
          </div>
        </div>
      )}

      {promos.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Accuracy by promotion</p>
          {promos.map(([name, v]) => {
            const pct = Math.round((v.right / v.total) * 100);
            return (
              <div key={name} className="flex items-center gap-3 text-xs font-bold">
                <span className="w-16 shrink-0 truncate uppercase">{name}</span>
                <div className="h-2.5 flex-1 bg-white/5"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
                <span className="w-20 text-right tabular-nums text-muted-foreground">{pct}% · {v.right}/{v.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
