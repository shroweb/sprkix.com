import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

// GET — current user's predictions for an event
// Query params: eventId (required)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");

  if (!eventId) return err("eventId query param is required");

  const predictions = await prisma.prediction.findMany({
    where: {
      userId: user.id,
      match: { eventId },
    },
    select: {
      matchId: true,
      predictedWinnerId: true,
    },
  });

  return ok(predictions);
});
