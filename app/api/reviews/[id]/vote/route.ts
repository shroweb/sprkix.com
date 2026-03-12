import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";

// POST /api/reviews/[id]/vote — toggle upvote
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Login required" }, { status: 401 });

  const { id: reviewId } = await params;

  const existing = await prisma.reviewVote.findUnique({
    where: { userId_reviewId: { userId: user.id, reviewId } },
  });

  if (existing) {
    // Toggle off
    await prisma.reviewVote.delete({ where: { id: existing.id } });
    const count = await prisma.reviewVote.count({ where: { reviewId } });
    return NextResponse.json({ voted: false, count });
  } else {
    await prisma.reviewVote.create({ data: { userId: user.id, reviewId } });
    const count = await prisma.reviewVote.count({ where: { reviewId } });
    return NextResponse.json({ voted: true, count });
  }
}
