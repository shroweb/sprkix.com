import { prisma } from "../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../lib/getUserFromServerCookie";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { matchId, rating } = await req.json();

  await prisma.matchRating.upsert({
    where: { userId_matchId: { matchId, userId: user.id } },
    update: { rating },
    create: { matchId, userId: user.id, rating },
  });

  const ratings = await prisma.matchRating.findMany({ where: { matchId } });
  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  await prisma.match.update({
    where: { id: matchId },
    data: { rating: avg },
  });

  return NextResponse.json({ success: true, average: avg });
}
