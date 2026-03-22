import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromBearer } from "@lib/v1/auth";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

// GET active homepage polls (no eventId)
export const GET = withErrorHandling(async (req: NextRequest) => {
  const currentUser = await getUserFromBearer(req);

  const polls = await prisma.poll.findMany({
    where: {
      isActive: true,
      eventId: null,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
    take: 1,
    include: {
      options: {
        orderBy: { order: "asc" },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });

  // Fetch current user's vote for each poll if authenticated
  const userVotes: Record<string, string | null> = {};
  if (currentUser && polls.length > 0) {
    const votes = await prisma.pollVote.findMany({
      where: { userId: currentUser.id, pollId: { in: polls.map((p) => p.id) } },
      select: { pollId: true, optionId: true },
    });
    for (const v of votes) userVotes[v.pollId] = v.optionId;
  }

  const data = polls.map((p) => ({
    id: p.id,
    question: p.question,
    endsAt: p.endsAt,
    totalVotes: p._count.votes,
    userVote: userVotes[p.id] ?? null,
    options: p.options.map((o) => ({ id: o.id, text: o.text, votes: o._count.votes })),
  }));

  return ok(data);
});
