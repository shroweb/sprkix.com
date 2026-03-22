import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest, ctx: any) => {
  const user = await requireAuth(req);
  const { id: pollId } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const { optionId } = body;

  if (!optionId) return err("optionId is required");

  const poll = await prisma.poll.findUnique({ where: { id: pollId }, select: { id: true } });
  if (!poll) return err("Poll not found", 404);

  const existing = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: user.id } },
    select: { optionId: true },
  });

  if (existing) {
    if (existing.optionId === optionId) {
      await prisma.pollVote.delete({ where: { pollId_userId: { pollId, userId: user.id } } });
    } else {
      await prisma.pollVote.update({
        where: { pollId_userId: { pollId, userId: user.id } },
        data: { optionId },
      });
    }
  } else {
    await prisma.pollVote.create({ data: { pollId, optionId, userId: user.id } });
  }

  const updatedOptions = await prisma.pollOption.findMany({
    where: { pollId },
    orderBy: { order: "asc" },
    include: { _count: { select: { votes: true } } },
  });

  const totalVotes = updatedOptions.reduce((sum, o) => sum + o._count.votes, 0);

  const userVoteRecord = await prisma.pollVote.findUnique({
    where: { pollId_userId: { pollId, userId: user.id } },
    select: { optionId: true },
  });

  return ok({
    userVote: userVoteRecord?.optionId ?? null,
    totalVotes,
    options: updatedOptions.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
  });
});
