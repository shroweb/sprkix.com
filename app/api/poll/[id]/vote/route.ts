import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: pollId } = await params;
  const body = await req.json();
  const { optionId } = body as { optionId: string };

  if (!optionId) {
    return NextResponse.json({ error: "Missing optionId" }, { status: 400 });
  }

  // Ensure the poll exists
  const poll = await prisma.poll.findUnique({ where: { id: pollId } });
  if (!poll) {
    return NextResponse.json({ error: "Poll not found" }, { status: 404 });
  }

  // Check existing vote
  const existingVote = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: user.id } },
    select: { optionId: true },
  });

  if (existingVote) {
    if (existingVote.optionId === optionId) {
      // Same option — toggle off (unvote)
      await prisma.pollVote.delete({
        where: { pollId_userId: { pollId, userId: user.id } },
      });
    } else {
      // Different option — switch vote
      await prisma.pollVote.update({
        where: { pollId_userId: { pollId, userId: user.id } },
        data: { optionId },
      });
    }
  } else {
    // No existing vote — create new
    await prisma.pollVote.create({
      data: { pollId, optionId, userId: user.id },
    });
  }

  // Fetch updated vote counts
  const updatedOptions = await prisma.pollOption.findMany({
    where: { pollId },
    include: { _count: { select: { votes: true } } },
  });

  const votes: Record<string, number> = {};
  for (const opt of updatedOptions) {
    votes[opt.id] = opt._count.votes;
  }

  const userVoteRecord = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: user.id } },
    select: { optionId: true },
  });

  return NextResponse.json({
    success: true,
    votes,
    userVote: userVoteRecord?.optionId ?? null,
  });
}
