import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, predictedWinnerId } = await req.json();

  if (!matchId) {
    return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
  }

  try {
    // Match must exist, belong to an event with predictions on, and not be resolved yet.
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        participants: { select: { isWinner: true, wrestlerId: true } },
        event: { select: { enablePredictions: true, startTime: true } },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.event && match.event.enablePredictions === false) {
      return NextResponse.json({ error: "Predictions aren't open for this event" }, { status: 403 });
    }
    if (match.participants.some((p) => p.isWinner === true)) {
      return NextResponse.json(
        { error: "Predictions are locked — this match has already been resolved" },
        { status: 403 }
      );
    }
    if (match.event?.startTime && new Date() >= match.event.startTime) {
      return NextResponse.json(
        { error: "Predictions are locked — the event has already started" },
        { status: 403 }
      );
    }
    // A pick must be one of the wrestlers actually in this match.
    if (predictedWinnerId !== null && predictedWinnerId !== undefined) {
      if (typeof predictedWinnerId !== "string" || !match.participants.some((p) => p.wrestlerId === predictedWinnerId)) {
        return NextResponse.json({ error: "That wrestler isn't in this match" }, { status: 400 });
      }
    }

    if (predictedWinnerId === null || predictedWinnerId === undefined) {
      // Toggle off — delete prediction
      try {
        await prisma.prediction.deleteMany({ where: { userId: user.id, matchId } });
      } catch {
        // Prediction table not yet in DB — treat as success
      }
      return NextResponse.json({ success: true, deleted: true });
    }

    // Save prediction
    const prediction = await prisma.prediction.upsert({
      where: { userId_matchId: { userId: user.id, matchId } },
      update: { predictedWinnerId },
      create: { userId: user.id, matchId, predictedWinnerId },
    });

    return NextResponse.json({ success: true, prediction });
  } catch (error: any) {
    // P2021 = table does not exist, P2022 = column does not exist
    if (error?.code === "P2021" || error?.code === "P2022") {
      // DB not yet migrated — return success so the UI doesn't revert
      return NextResponse.json({ success: true, pending: true });
    }
    console.error("Prediction error:", error);
    return NextResponse.json({ error: "Failed to save prediction" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const matchId = searchParams.get("matchId");

  if (!matchId) {
    return NextResponse.json({ error: "Match ID is required" }, { status: 400 });
  }

  try {
    const predictions = await prisma.prediction.findMany({
      where: { matchId },
      select: { predictedWinnerId: true },
    });

    const total = predictions.length;
    if (total === 0) return NextResponse.json({ stats: [] });

    const counts: Record<string, number> = {};
    predictions.forEach((p: any) => {
      if (p.predictedWinnerId) {
        counts[p.predictedWinnerId] = (counts[p.predictedWinnerId] || 0) + 1;
      }
    });

    const stats = Object.entries(counts).map(([winnerId, count]) => ({
      winnerId,
      percentage: Math.round((count / total) * 100),
      count,
    }));

    return NextResponse.json({ stats, total });
  } catch (error: any) {
    // Prediction table not yet in DB — return empty stats
    if (error?.code === "P2021" || error?.code === "P2022") {
      return NextResponse.json({ stats: [], total: 0 });
    }
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
