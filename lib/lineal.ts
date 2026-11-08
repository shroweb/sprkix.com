// Lineal championship engine — pure functions, no database access.
//
// A lineal title changes hands when the current holder LOSES a qualifying match
// ("the man who beat the man"), whatever belt was on the line and whatever
// promotion it was in. This is a fan-tracked, unofficial concept.

export interface EngineParticipant {
  wrestlerId: string;
  team: number | null;
  isWinner: boolean | null;
}

export interface EngineMatch {
  id: string;
  type: string | null;
  result: string | null;
  participants: EngineParticipant[];
}

export interface LinealRules {
  /** Triple threats, fatal 4-ways etc. change the holder when the holder doesn't win. */
  allowMultiMan: boolean;
  /** DQ / count-out / no-contest finishes never change the holder. */
  requireClean: boolean;
}

export const DEFAULT_RULES: LinealRules = { allowMultiMan: false, requireClean: true };

export type MatchVerdict =
  | { kind: "skip" }
  | { kind: "defence" }
  | { kind: "change"; winnerId: string }
  | { kind: "review"; reason: string };

const BATTLE_ROYAL = /battle\s*royal|royal\s*rumble|rumble|gauntlet|survival\s*of/i;
const NOT_CLEAN = /\b(dq|disqualif\w*|count[\s-]*out|no[\s-]*contest|draw|double|time[\s-]*limit|no[\s-]*decision|referee\s*stoppage\s*draw)\b/i;

/** Decide what a single match means for the current holder. */
export function judgeMatch(holderId: string, match: EngineMatch, rules: LinealRules): MatchVerdict {
  const { participants } = match;
  if (!participants.some((p) => p.wrestlerId === holderId)) return { kind: "skip" };

  if (BATTLE_ROYAL.test(match.type ?? "")) return { kind: "skip" };

  // Tag / team matches never count (any side with more than one person).
  const teamSizes = new Map<number, number>();
  for (const p of participants) {
    if (p.team !== null) teamSizes.set(p.team, (teamSizes.get(p.team) ?? 0) + 1);
  }
  if ([...teamSizes.values()].some((n) => n > 1)) return { kind: "skip" };
  if (/\btag\b/i.test(match.type ?? "")) return { kind: "skip" };

  const winners = participants.filter((p) => p.isWinner === true);
  if (winners.length !== 1) return { kind: "skip" }; // no result, draw, or several winners
  if (rules.requireClean && NOT_CLEAN.test(match.result ?? "")) return { kind: "skip" };

  const winner = winners[0];
  if (winner.wrestlerId === holderId) return { kind: "defence" };

  if (participants.length === 2) return { kind: "change", winnerId: winner.wrestlerId };

  // 3+ people and the holder did not win.
  if (rules.allowMultiMan) return { kind: "change", winnerId: winner.wrestlerId };
  return {
    kind: "review",
    reason: "Multi-man match: holder did not win, but we can't tell if the holder was the one pinned",
  };
}

export interface ReignSeed {
  wrestlerId: string;
  startedAt: Date;
  startMatchId?: string | null;
  /** Which reign this is for the seed wrestler (default 1). */
  reignNumber?: number;
}

export interface EngineReign {
  wrestlerId: string;
  reignNumber: number;
  startedAt: Date;
  endedAt: Date | null;
  startMatchId: string | null;
  endMatchId: string | null;
  defences: number;
  source: "seed" | "auto";
}

export interface ReviewItem {
  matchId: string;
  at: Date;
  reason: string;
}

/** A match plus when it happened, already sorted oldest → newest by the caller. */
export type TimedMatch = EngineMatch & { at: Date };

/** Walk matches in order from the seed holder and return the reign history. */
export function computeReigns(
  seed: ReignSeed,
  matches: TimedMatch[],
  rules: LinealRules = DEFAULT_RULES,
): { reigns: EngineReign[]; reviews: ReviewItem[] } {
  const counts = new Map<string, number>([[seed.wrestlerId, seed.reignNumber ?? 1]]);
  const reigns: EngineReign[] = [
    {
      wrestlerId: seed.wrestlerId,
      reignNumber: seed.reignNumber ?? 1,
      startedAt: seed.startedAt,
      endedAt: null,
      startMatchId: seed.startMatchId ?? null,
      endMatchId: null,
      defences: 0,
      source: "seed",
    },
  ];
  const reviews: ReviewItem[] = [];

  for (const match of matches) {
    const current = reigns[reigns.length - 1];
    const verdict = judgeMatch(current.wrestlerId, match, rules);
    if (verdict.kind === "defence") {
      current.defences++;
    } else if (verdict.kind === "review") {
      reviews.push({ matchId: match.id, at: match.at, reason: verdict.reason });
    } else if (verdict.kind === "change") {
      current.endedAt = match.at;
      current.endMatchId = match.id;
      const n = (counts.get(verdict.winnerId) ?? 0) + 1;
      counts.set(verdict.winnerId, n);
      reigns.push({
        wrestlerId: verdict.winnerId,
        reignNumber: n,
        startedAt: match.at,
        endedAt: null,
        startMatchId: match.id,
        endMatchId: null,
        defences: 0,
        source: "auto",
      });
    }
  }

  return { reigns, reviews };
}

/** Whole days between two dates (UTC), at least 0. */
export function daysBetween(from: Date, to: Date): number {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 86_400_000));
}
