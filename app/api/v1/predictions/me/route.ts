import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

// GET — current user's predictions
// ?eventId=xxx  → predictions for a specific event [{ matchId, predictedWinnerId }]
// (no params)   → distinct event IDs/slugs the user has any prediction for [{ eventId, slug }]
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (eventId) {
    const predictions = await prisma.prediction.findMany({
      where: { userId: user.id, match: { eventId } },
      select: { matchId: true, predictedWinnerId: true },
    });
    return ok(predictions);
  }

  // No eventId — return distinct events with per-event score
  const rows = await prisma.prediction.findMany({
    where: { userId: user.id },
    select: {
      predictedWinnerId: true,
      match: {
        select: {
          event: { select: { id: true, slug: true } },
          participants: { select: { isWinner: true, wrestler: { select: { id: true } } } },
        },
      },
    },
  });

  const eventMap = new Map<string, { eventId: string; slug: string; correct: number; total: number }>();
  for (const r of rows) {
    const ev = r.match.event;
    if (!eventMap.has(ev.id)) eventMap.set(ev.id, { eventId: ev.id, slug: ev.slug, correct: 0, total: 0 });
    const entry = eventMap.get(ev.id)!;
    const hasResults = r.match.participants.some((p) => p.isWinner);
    if (hasResults) {
      if (!r.predictedWinnerId) continue; // cleared pick shouldn't count toward score
      entry.total++;
      const winnerIds = r.match.participants.filter((p) => p.isWinner).map((p) => p.wrestler.id);
      if (winnerIds.includes(r.predictedWinnerId)) entry.correct++;
    }
  }

  return ok(Array.from(eventMap.values()));
});
