import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

function eventIsLive(event: { startTime: Date | null; endTime: Date | null }): boolean {
  if (!event.startTime) return false;
  const now = new Date();
  const end = event.endTime ?? new Date(event.startTime.getTime() + 4 * 60 * 60 * 1000);
  return now >= event.startTime && now <= end;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const comments = await prisma.liveComment.findMany({
      where: { eventId: id },
      include: {
        user: {
          select: { name: true, avatarUrl: true, isAdmin: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Reverse so client receives oldest→newest (correct chat order)
    return NextResponse.json({ comments: comments.reverse() });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat" }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { text, matchId } = await req.json();

  if (!text?.trim()) {
    return NextResponse.json({ error: "Message is empty" }, { status: 400 });
  }

  try {
    // Gate: only allow posting while the event is actually live
    const event = await prisma.event.findUnique({
      where: { id },
      select: { startTime: true, endTime: true },
    });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }
    if (!eventIsLive(event)) {
      return NextResponse.json(
        { error: "Chat is only open during the live event" },
        { status: 403 }
      );
    }

    const comment = await prisma.liveComment.create({
      data: {
        text: text.slice(0, 500),
        userId: user.id,
        eventId: id,
        matchId,
      },
      include: {
        user: {
          select: { name: true, avatarUrl: true, isAdmin: true },
        },
      },
    });

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
