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
    // Lock: reject if match already has a result, or if the event has started
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        result: true,
        event: { select: { startTime: true } },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    if (match.result) {
      return NextResponse.json(
        { error: "Predictions are locked — this match has already been resolved" },
        { status: 403 }
      );
    }
    // If a startTime is set and the event has begun, lock predictions
    if (match.event.startTime && new Date() >= match.event.startTime) {
      return NextResponse.json(
        { error: "Predictions are locked — the event has already started" },
        { status: 403 }
      );
    }

    if (predictedWinnerId === null) {
      // Delete prediction if null is passed (toggle off)
      await prisma.prediction.deleteMany({
        where: { userId: user.id, matchId },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    const prediction = await prisma.prediction.upsert({
      where: {
        userId_matchId: { userId: user.id, matchId },
      },
      update: { predictedWinnerId },
      create: { userId: user.id, matchId, predictedWinnerId },
    });

    return NextResponse.json({ success: true, prediction });
  } catch (error) {
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
    if (total === 0) {
      return NextResponse.json({ stats: [] });
    }

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
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
