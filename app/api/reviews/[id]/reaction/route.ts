import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;
    const user = await getUserFromServerCookie();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reactionType } = await req.json();
    if (!reactionType || !["upvote", "fire", "spot_on", "detailed"].includes(reactionType)) {
      return NextResponse.json({ error: "Invalid reaction type" }, { status: 400 });
    }

    const existing = await prisma.reviewVote.findUnique({
      where: {
        userId_reviewId_reactionType: {
          userId: user.id,
          reviewId,
          reactionType,
        },
      },
    });

    if (existing) {
      // Toggle off
      await prisma.reviewVote.delete({
        where: { id: existing.id },
      });
    } else {
      // Add reaction
      await prisma.reviewVote.create({
        data: {
          userId: user.id,
          reviewId,
          reactionType,
        },
      });
    }

    // Get aggregated counts
    const reactions = await prisma.reviewVote.groupBy({
      by: ["reactionType"],
      where: { reviewId },
      _count: { _all: true },
    });

    const userReactions = await prisma.reviewVote.findMany({
      where: { reviewId, userId: user.id },
      select: { reactionType: true },
    });

    return NextResponse.json({
      success: true,
      counts: Object.fromEntries(reactions.map((r) => [r.reactionType, r._count._all])),
      userReactions: userReactions.map((r) => r.reactionType),
    });
  } catch (err) {
    console.error("Reaction error:", err);
    return NextResponse.json({ error: "Failed to update reaction" }, { status: 500 });
  }
}
