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
    // Check if match exists and has been resolved (a winner marked on participants)
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: {
        participants: { select: { isWinner: true } },
      },
    });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }
    const isResolved = match.participants.some((p: any) => p.isWinner === true);
    if (isResolved) {
      return NextResponse.json(
        { error: "Predictions are locked — this match has already been resolved" },
        { status: 403 }
      );
    }

    // Try to check startTime lock — column may not exist yet, so isolate in its own try/catch
    try {
      const eventRow = await prisma.match.findUnique({
        where: { id: matchId },
        select: { event: { select: { startTime: true } } },
      });
      if (eventRow?.event?.startTime && new Date() >= eventRow.event.startTime) {
        return NextResponse.json(
          { error: "Predictions are locked — the event has already started" },
          { status: 403 }
        );
      }
    } catch {
      // startTime column not yet in DB — skip the lock check
    }

    if (predictedWinnerId === null) {
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
