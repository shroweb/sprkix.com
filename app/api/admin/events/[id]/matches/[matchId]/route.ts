import { NextResponse } from "next/server";
import { prisma } from "../../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../../lib/server-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId } = await params;
    const body = await req.json();
    const { title, type, result, duration, participants } = body;

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: {
        title,
        type,
        result: result || null,
        duration: duration ? parseInt(duration) : null,
        participants: participants
          ? {
              deleteMany: {},
              create: participants.map((p: any) => ({
                wrestlerId: p.wrestlerId,
                team: p.team,
                isWinner: p.isWinner,
              })),
            }
          : undefined,
      },
      include: {
        participants: { include: { wrestler: true }, orderBy: { team: "asc" } },
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Failed to update match" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; matchId: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { matchId } = await params;
    await prisma.match.delete({
      where: { id: matchId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Failed to delete match" },
      { status: 500 },
    );
  }
}
