import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../../../lib/server-auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, matchId } = await params;
  const { result, winners } = await req.json(); // winners = string[] of participantIds

  // Update match result text
  await prisma.match.update({
    where: { id: matchId },
    data: { result: result ?? null },
  });

  // Reset all participants, then set winners
  await prisma.matchParticipant.updateMany({
    where: { matchId },
    data: { isWinner: false },
  });

  if (winners?.length > 0) {
    await prisma.matchParticipant.updateMany({
      where: { matchId, id: { in: winners } },
      data: { isWinner: true },
    });
  }

  return NextResponse.json({ success: true });
}
