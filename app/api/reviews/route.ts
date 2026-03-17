import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { eventId, rating, comment } = body;
  // userId always comes from the verified session — never trusted from the client
  const userId = user.id;

  const [review, event] = await Promise.all([
    prisma.review.upsert({
      where: {
        userId_eventId: { userId, eventId }
      },
      update: { rating, comment },
      create: { rating, comment, userId, eventId }
    }),
    prisma.event.findUnique({
      where: { id: eventId },
      select: { title: true, slug: true },
    }),
  ]);

  return NextResponse.json(review);
}
