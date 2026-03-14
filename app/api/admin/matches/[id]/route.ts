import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// PATCH: update match fields and optionally participants
export async function PATCH(req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, result, type, duration, order, participants } = body;

  await prisma.match.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(result !== undefined && { result }),
      ...(type !== undefined && { type }),
      ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
      ...(order !== undefined && { order: order ? parseInt(order) : null }),
    },
  });

  if (participants !== undefined) {
    await prisma.matchParticipant.deleteMany({ where: { matchId: id } });
    if (participants.length > 0) {
      await prisma.matchParticipant.createMany({
        data: participants.map((p: any) => ({
          matchId: id,
          wrestlerId: p.wrestlerId,
          team: p.team ?? null,
          isWinner: p.isWinner ?? false,
        })),
      });
    }
  }

  const updated = await prisma.match.findUnique({
    where: { id },
    include: {
      participants: { include: { wrestler: { select: { id: true, name: true, imageUrl: true } } } },
      event: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json({ success: true, match: updated });
}

// DELETE: remove match
export async function DELETE(_req: NextRequest, { params }: { params: any }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.match.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
