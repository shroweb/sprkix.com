// Database side of the lineal championship system.
import { prisma } from "@lib/prisma";
import { computeReigns, type TimedMatch, type ReviewItem } from "@lib/lineal";
import { notifyLinealChange } from "@lib/discord";

export interface RecomputeResult {
  slug: string;
  matchesChecked: number;
  reigns: number;
  holderChanged: boolean;
  previousHolder: string | null;
  currentHolder: string | null;
  reviews: ReviewItem[];
}

/**
 * Re-derive a title's reign history from the seed reign forward.
 * Deterministic: the seed row is the only hand-entered fact; every later reign is
 * rebuilt from match results, so late imports and corrected results are picked up.
 */
export async function recomputeLinealTitle(titleId: string): Promise<RecomputeResult | null> {
  const title = await prisma.linealTitle.findUnique({
    where: { id: titleId },
    include: { reigns: { orderBy: { startedAt: "asc" }, include: { wrestler: { select: { name: true, slug: true } } } } },
  });
  if (!title) return null;

  const seed = title.reigns.find((r) => r.source === "seed");
  if (!seed) return null;
  const previousCurrent = [...title.reigns].reverse().find((r) => r.endedAt === null) ?? null;

  const dayStart = new Date(Date.UTC(seed.startedAt.getUTCFullYear(), seed.startedAt.getUTCMonth(), seed.startedAt.getUTCDate()));
  const raw = await prisma.match.findMany({
    where: {
      event: { date: { gte: dayStart } },
      participants: { some: { isWinner: true } },
    },
    select: {
      id: true,
      type: true,
      result: true,
      order: true,
      createdAt: true,
      event: { select: { date: true, startTime: true } },
      participants: { select: { wrestlerId: true, team: true, isWinner: true } },
    },
  });

  // Card order isn't stored reliably (order defaults to 1), so fall back to import order.
  const sorted = raw
    .map((m) => ({ m, at: m.event.startTime ?? m.event.date }))
    .sort(
      (a, b) =>
        a.at.getTime() - b.at.getTime() ||
        (a.m.order ?? 1) - (b.m.order ?? 1) ||
        a.m.createdAt.getTime() - b.m.createdAt.getTime(),
    );

  // Start strictly after the seed match; with no seed match, after the seed day.
  let startIdx = 0;
  if (seed.startMatchId) {
    const i = sorted.findIndex((x) => x.m.id === seed.startMatchId);
    startIdx = i >= 0 ? i + 1 : sorted.findIndex((x) => x.at.getTime() > dayStart.getTime() + 86_400_000 - 1);
    if (startIdx < 0) startIdx = sorted.length;
  } else {
    const i = sorted.findIndex((x) => x.at.getTime() >= dayStart.getTime() + 86_400_000);
    startIdx = i < 0 ? sorted.length : i;
  }

  const matches: TimedMatch[] = sorted.slice(startIdx).map(({ m, at }) => ({
    id: m.id,
    at,
    type: m.type,
    result: m.result,
    participants: m.participants,
  }));

  const { reigns, reviews } = computeReigns(
    {
      wrestlerId: seed.wrestlerId,
      startedAt: seed.startedAt,
      startMatchId: seed.startMatchId,
      reignNumber: seed.reignNumber,
    },
    matches,
    { allowMultiMan: title.allowMultiMan, requireClean: title.requireClean },
  );

  // Seed row is updated in place (it holds the curated note); later reigns are rebuilt.
  const [first, ...rest] = reigns;
  await prisma.linealReign.update({
    where: { id: seed.id },
    data: { endedAt: first.endedAt, endMatchId: first.endMatchId, defences: first.defences },
  });
  await prisma.linealReign.deleteMany({ where: { titleId, source: "auto" } });
  if (rest.length > 0) {
    await prisma.linealReign.createMany({
      data: rest.map((r) => ({
        titleId,
        wrestlerId: r.wrestlerId,
        reignNumber: r.reignNumber,
        startedAt: r.startedAt,
        endedAt: r.endedAt,
        startMatchId: r.startMatchId,
        endMatchId: r.endMatchId,
        defences: r.defences,
        source: "auto",
      })),
    });
  }

  const currentReign = reigns[reigns.length - 1];
  const holderChanged = !!previousCurrent && previousCurrent.wrestlerId !== currentReign.wrestlerId;

  const names = await prisma.wrestler.findMany({
    where: { id: { in: [currentReign.wrestlerId, previousCurrent?.wrestlerId ?? ""] } },
    select: { id: true, name: true, slug: true },
  });
  const nameOf = (id: string | undefined) => names.find((n) => n.id === id)?.name ?? null;

  if (holderChanged) {
    await notifyLinealChange({
      titleName: title.name,
      titleSlug: title.slug,
      emoji: title.emoji,
      from: nameOf(previousCurrent?.wrestlerId),
      to: nameOf(currentReign.wrestlerId) ?? "Unknown",
    });
  }

  return {
    slug: title.slug,
    matchesChecked: matches.length,
    reigns: reigns.length,
    holderChanged,
    previousHolder: nameOf(previousCurrent?.wrestlerId),
    currentHolder: nameOf(currentReign.wrestlerId),
    reviews,
  };
}

export async function recomputeAllLinealTitles(): Promise<RecomputeResult[]> {
  const titles = await prisma.linealTitle.findMany({ where: { isActive: true }, select: { id: true } });
  const out: RecomputeResult[] = [];
  for (const t of titles) {
    try {
      const r = await recomputeLinealTitle(t.id);
      if (r) out.push(r);
    } catch (err) {
      console.error(`[lineal] recompute failed for ${t.id}:`, err);
    }
  }
  return out;
}

/** Fire-and-forget safe wrapper for hooks inside other routes: never throws. */
export async function recomputeLinealQuietly() {
  try {
    await recomputeAllLinealTitles();
  } catch (err) {
    console.error("[lineal] recompute (quiet) failed:", err);
  }
}
