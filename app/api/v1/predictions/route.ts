import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

// POST — submit or clear a prediction
export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { matchId, predictedWinnerId } = body;

  if (!matchId) return err("matchId is required");

  // Check match exists and isn't resolved
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    select: {
      participants: { select: { isWinner: true } },
      event: { select: { startTime: true } },
    },
  });
  if (!match) return err("Match not found", 404);

  const isResolved = match.participants.some((p: any) => p.isWinner === true);
  if (isResolved) return err("Predictions are locked — this match has already been resolved", 403);

  if (match.event?.startTime && new Date() >= match.event.startTime) {
    return err("Predictions are locked — the event has already started", 403);
  }

  if (predictedWinnerId === null) {
    await prisma.prediction.deleteMany({ where: { userId: user.id, matchId } }).catch(() => {});
    return ok({ deleted: true });
  }

  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { predictedWinnerId },
    create: { userId: user.id, matchId, predictedWinnerId },
    select: { id: true, matchId: true, predictedWinnerId: true, createdAt: true },
  });

  return ok(prediction);
});

// GET — community prediction stats for a match
export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) return err("matchId query param is required");

  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    select: { predictedWinnerId: true },
  });

  const total = predictions.length;
  if (total === 0) return ok({ stats: [], total: 0 });

  const counts: Record<string, number> = {};
  predictions.forEach((p: any) => {
    if (p.predictedWinnerId) {
      counts[p.predictedWinnerId] = (counts[p.predictedWinnerId] || 0) + 1;
    }
  });

  const stats = Object.entries(counts).map(([winnerId, count]) => ({
    winnerId,
    count,
    percentage: Math.round((count / total) * 100),
  }));

  return ok({ stats, total });
});
