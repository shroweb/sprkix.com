import { NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../lib/server-auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { title, type, duration, result, participants } = body;

    // Create the match with its participants in a transaction
    const newMatch = await prisma.match.create({
      data: {
        eventId: id,
        title,
        type,
        duration: duration ? parseInt(duration) : null,
        result,
        participants: {
          create: participants.map((p: any) => ({
            wrestlerId: p.wrestlerId,
            team: p.team,
            isWinner: p.isWinner,
          })),
        },
      },
      include: {
        participants: {
          include: { wrestler: true },
          orderBy: { team: "asc" },
        },
      },
    });

    return NextResponse.json(newMatch);
  } catch (error) {
    console.error("Error saving match:", error);
    return NextResponse.json(
      { error: "Failed to create match" },
      { status: 500 },
    );
  }
}
