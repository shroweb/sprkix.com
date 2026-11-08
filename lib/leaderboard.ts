// Prediction leaderboard: period handling and pure ranking logic.

export type LeaderboardPeriod = "month" | "season" | "all";

export const LEADERBOARD_PERIODS: { id: LeaderboardPeriod; label: string }[] = [
  { id: "month", label: "This Month" },
  { id: "season", label: "This Year" },
  { id: "all", label: "All Time" },
];

export function parsePeriod(value: string | string[] | undefined): LeaderboardPeriod {
  const v = Array.isArray(value) ? value[0] : value;
  return v === "month" || v === "season" ? v : "all";
}

/** Start of the period (UTC) or null for all-time. A "season" is the calendar year. */
export function periodStart(period: LeaderboardPeriod, now = new Date()): Date | null {
  if (period === "month") return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  if (period === "season") return new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
  return null;
}

export interface ResolvedPrediction {
  userId: string;
  isCorrect: boolean;
  /** Date of the event the pick was for — streaks follow event order, not when the pick was saved. */
  eventDate: Date;
}

export interface LeaderboardRow {
  userId: string;
  correct: number;
  total: number;
  accuracy: number;
  streak: number;
}

export const MIN_PREDICTIONS_TO_QUALIFY = 3;

export function rankPredictors(
  predictions: ResolvedPrediction[],
  minPredictions = MIN_PREDICTIONS_TO_QUALIFY,
  limit = 50,
): LeaderboardRow[] {
  const byUser = new Map<string, ResolvedPrediction[]>();
  for (const p of predictions) {
    const list = byUser.get(p.userId);
    if (list) list.push(p);
    else byUser.set(p.userId, [p]);
  }

  const rows: LeaderboardRow[] = [];
  for (const [userId, list] of byUser) {
    if (list.length < minPredictions) continue;
    const correct = list.filter((p) => p.isCorrect).length;
    list.sort((a, b) => b.eventDate.getTime() - a.eventDate.getTime());
    let streak = 0;
    for (const p of list) {
      if (!p.isCorrect) break;
      streak++;
    }
    rows.push({
      userId,
      correct,
      total: list.length,
      accuracy: Math.round((correct / list.length) * 100),
      streak,
    });
  }

  return rows
    .sort((a, b) => b.accuracy - a.accuracy || b.total - a.total || b.streak - a.streak)
    .slice(0, limit);
}
