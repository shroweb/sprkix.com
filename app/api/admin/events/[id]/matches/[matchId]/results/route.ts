import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../../../lib/server-auth";
import { sendPushToUser } from "../../../../../../../../lib/push";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: eventId, matchId } = await params;
  const { result, winners } = await req.json(); // winners = string[] of participantIds

  // Update match result text
  await prisma.match.update({
    where: { id: matchId },
    data: { result: result ?? null },
  });

  // Reset all participants, then set winners
  await prisma.matchParticipant.updateMany({
    where: { matchId },
    data: { isWinner: false },
  });

  if (winners?.length > 0) {
    await prisma.matchParticipant.updateMany({
      where: { matchId, id: { in: winners } },
      data: { isWinner: true },
    });
  }

  // ── Prediction Resolution ──────────────────────────────────────────────────
  // Only resolve if winners were supplied
  if (winners?.length > 0) {
    // Get the wrestler IDs of the winners (predictions store wrestlerId, not participantId)
    const winningParticipants = await prisma.matchParticipant.findMany({
      where: { matchId, isWinner: true },
      select: { wrestlerId: true },
    });
    const winningWrestlerIds = new Set(winningParticipants.map((p) => p.wrestlerId));

    // Get the match + event for notification copy
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { title: true, event: { select: { slug: true, title: true } } },
    });

    // Fetch all predictions for this match
    const matchPredictions = await prisma.prediction.findMany({
      where: { matchId },
      select: { id: true, userId: true, predictedWinnerId: true },
    });

    if (matchPredictions.length > 0) {
      // Resolve each prediction
      const correctUserIds: string[] = [];

      for (const prediction of matchPredictions) {
        const isCorrect = prediction.predictedWinnerId
          ? winningWrestlerIds.has(prediction.predictedWinnerId)
          : false;

        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { isCorrect },
        });

        if (isCorrect) correctUserIds.push(prediction.userId);
      }

      // Recalculate each affected user's running totals from scratch
      const uniqueUserIds = [...new Set(matchPredictions.map((p) => p.userId))];
      await Promise.all(
        uniqueUserIds.map(async (userId) => {
          const [correctCount, resolvedCount] = await Promise.all([
            prisma.prediction.count({ where: { userId, isCorrect: true } }),
            prisma.prediction.count({ where: { userId, isCorrect: { not: null } } }),
          ]);
          await prisma.user.update({
            where: { id: userId },
            data: { predictionScore: correctCount, predictionCount: resolvedCount },
          });
        }),
      );

      // Fire notifications for all predictors
      if (match?.event) {
        const eventSlug = match.event.slug;
        const matchTitle = match.title;
        const wrongUserIds = matchPredictions
          .filter((p) => !correctUserIds.includes(p.userId) && p.predictedWinnerId)
          .map((p) => p.userId);

        const notificationData = [
          ...correctUserIds.map((userId) => ({
            userId,
            type: "prediction_correct",
            message: "You called it! 🎯",
            detail: matchTitle,
            link: `/events/${eventSlug}`,
          })),
          ...wrongUserIds.map((userId) => ({
            userId,
            type: "prediction_wrong",
            message: "Wrong pick this time",
            detail: matchTitle,
            link: `/events/${eventSlug}`,
          })),
        ];

        if (notificationData.length > 0) {
          await prisma.notification.createMany({ data: notificationData });

          // Push notifications
          await Promise.all([
            ...correctUserIds.map((userId) =>
              sendPushToUser(userId, {
                title: "You called it! 🎯",
                body: matchTitle ? `Correct prediction: ${matchTitle}` : "Your prediction was correct!",
                data: { path: `/events/${eventSlug}` },
              })
            ),
            ...wrongUserIds.map((userId) =>
              sendPushToUser(userId, {
                title: "Wrong pick this time",
                body: matchTitle ? `Prediction settled: ${matchTitle}` : "Your prediction was incorrect",
                data: { path: `/events/${eventSlug}` },
              })
            ),
          ]);
        }
      }
    }
  }
  // ── End Resolution ─────────────────────────────────────────────────────────

  return NextResponse.json({ success: true });
}
