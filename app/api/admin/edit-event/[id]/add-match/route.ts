// /app/api/admin/edit-event/[id]/add-match/route.ts
import { prisma } from "../../../../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type MatchParticipantInput = {
  wrestlerId: string;
  isWinner: boolean;
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const result = formData.get("result") as string;
    const type = formData.get("type") as string;
    const duration = formData.get("duration") as string;

    const eventId = req.nextUrl.pathname.split("/").at(-2); // Extract [id] from path

    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    const participants: {
      wrestlerId: string;
      isWinner: boolean;
      team?: number;
    }[] = [];
    for (let i = 0; i < 4; i++) {
      const wrestlerId = formData.get(
        `participants[${i}].wrestlerId`,
      ) as string;
      const isWinner = formData.get(`participants[${i}].isWinner`) === "on";
      const teamRaw = formData.get(`participants[${i}].team`);
      if (wrestlerId) {
        participants.push({
          wrestlerId,
          isWinner,
          team: teamRaw ? parseInt(teamRaw.toString()) : undefined,
        });
      }
    }

    const match = await prisma.match.create({
      data: {
        title,
        result,
        type,
        duration: parseInt(duration),
        eventId,
        participants: {
          create: participants.map((p) => ({
            wrestlerId: p.wrestlerId,
            isWinner: p.isWinner,
            team: p.team ?? null,
          })),
        },
      },
    });

    return NextResponse.json({ success: true, match });
  } catch (error) {
    console.error("Add Match Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 },
    );
  }
}
