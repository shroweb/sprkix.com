import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

// GET — current user's prediction rank among all users
export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);

  // Get all users with at least one resolved prediction
  const users = await prisma.user.findMany({
    where: { predictionCount: { gt: 0 } },
    select: { id: true, predictionScore: true, predictionCount: true },
  });

  // Sort: accuracy desc, then raw score desc
  users.sort((a, b) => {
    const accA = a.predictionScore / a.predictionCount;
    const accB = b.predictionScore / b.predictionCount;
    if (accB !== accA) return accB - accA;
    return b.predictionScore - a.predictionScore;
  });

  const rank = users.findIndex((u) => u.id === user.id) + 1;
  const total = users.length;

  return ok({ rank: rank > 0 ? rank : null, total });
});
