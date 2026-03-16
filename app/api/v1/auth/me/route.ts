import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);

  // Compute prediction score: resolved predictions and how many were correct
  const userPredictions = await prisma.prediction.findMany({
    where: { userId: user.id },
    select: {
      predictedWinnerId: true,
      match: {
        select: {
          participants: { select: { id: true, isWinner: true } },
        },
      },
    },
  });

  const resolved = userPredictions.filter((p) =>
    p.match.participants.some((part) => part.isWinner)
  );
  const correct = resolved.filter((p) =>
    p.match.participants.some(
      (part) => part.id === p.predictedWinnerId && part.isWinner
    )
  );

  return ok({
    ...user,
    predictionCount: resolved.length,
    predictionScore: correct.length,
  });
});
