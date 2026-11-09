import { prisma } from "./prisma";

export interface RecapPick {
  matchId: string;
  title: string;
  picked: string;
  correct: boolean;
  /** Share of the community that picked the same side (0–100). */
  communityPct: number;
}

export interface Recap {
  eventTitle: string;
  eventSlug: string;
  promotion: string;
  userName: string;
  picks: RecapPick[];
  correct: number;
  total: number;
  perfect: boolean;
  bestCall: RecapPick | null; // correct pick the fewest people made
  worstMiss: RecapPick | null; // wrong pick the most people made
  accuracyAll: number | null;
}

/** Pure: derive headline stats from resolved picks. Exported for tests. */
export function summarize(picks: RecapPick[]) {
  const correct = picks.filter((p) => p.correct).length;
  const bestCall = picks.filter((p) => p.correct).sort((a, b) => a.communityPct - b.communityPct)[0] ?? null;
  const worstMiss = picks.filter((p) => !p.correct).sort((a, b) => b.communityPct - a.communityPct)[0] ?? null;
  return { correct, total: picks.length, perfect: picks.length >= 3 && correct === picks.length, bestCall, worstMiss };
}

export async function getRecap(eventSlug: string, userId: string): Promise<Recap | null> {
  const [event, user] = await Promise.all([
    prisma.event.findUnique({
      where: { slug: eventSlug },
      select: {
        title: true,
        slug: true,
        promotion: true,
        matches: {
          select: {
            id: true,
            title: true,
            participants: { select: { wrestlerId: true, team: true, isWinner: true, wrestler: { select: { name: true } } } },
            predictions: { select: { userId: true, predictedWinnerId: true } },
          },
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true, predictionScore: true, predictionCount: true } }),
  ]);
  if (!event || !user) return null;

  const picks: RecapPick[] = [];
  for (const m of event.matches) {
    const winners = new Set(m.participants.filter((p) => p.isWinner).map((p) => p.wrestlerId));
    if (winners.size === 0) continue; // unresolved
    const mine = m.predictions.find((p) => p.userId === userId);
    if (!mine?.predictedWinnerId) continue;

    // Community share for "the same side" — tag partners count as one side.
    const me = m.participants.find((p) => p.wrestlerId === mine.predictedWinnerId);
    const mySide = new Set(
      me && me.team != null ? m.participants.filter((p) => p.team === me.team).map((p) => p.wrestlerId) : [mine.predictedWinnerId],
    );
    const all = m.predictions.filter((p) => p.predictedWinnerId);
    const same = all.filter((p) => mySide.has(p.predictedWinnerId!)).length;

    picks.push({
      matchId: m.id,
      title: m.title,
      picked: m.participants.find((p) => p.wrestlerId === mine.predictedWinnerId)?.wrestler.name ?? "Unknown",
      correct: winners.has(mine.predictedWinnerId),
      communityPct: all.length ? Math.round((same / all.length) * 100) : 0,
    });
  }
  if (picks.length === 0) return null;

  return {
    eventTitle: event.title.replace(/–\s*\d{4}.*$/, "").trim(),
    eventSlug: event.slug,
    promotion: event.promotion,
    userName: user.name ?? "Member",
    picks,
    ...summarize(picks),
    accuracyAll: user.predictionCount > 0 ? Math.round((user.predictionScore / user.predictionCount) * 100) : null,
  };
}
