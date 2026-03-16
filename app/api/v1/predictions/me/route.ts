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

  // No eventId — return distinct events the user has predicted on
  const rows = await prisma.prediction.findMany({
    where: { userId: user.id },
    select: { match: { select: { event: { select: { id: true, slug: true } } } } },
    distinct: ["matchId"],
  });

  const seen = new Set<string>();
  const events: { eventId: string; slug: string }[] = [];
  for (const r of rows) {
    const ev = r.match.event;
    if (!seen.has(ev.id)) {
      seen.add(ev.id);
      events.push({ eventId: ev.id, slug: ev.slug });
    }
  }

  return ok(events);
});
