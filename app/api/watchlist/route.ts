import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { eventId } = await req.json();

  try {
    const item = await prisma.watchListItem.create({
      data: {
        userId: user.id,
        eventId,
        watchlist: true,
      },
    });
    revalidatePath("/watchlist", "page");
    revalidatePath("/events/[slug]", "page");
    return NextResponse.json(item);
  } catch {
    return NextResponse.json(
      { error: "Already in watchlist?" },
      { status: 400 },
    );
  }
}

export async function PATCH(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { eventId, watched, attended, watchlist } = await req.json();

  const data: any = {};
  if (watched !== undefined) data.watched = watched;
  if (attended !== undefined) data.attended = attended;
  if (watchlist !== undefined) data.watchlist = watchlist;

  await prisma.watchListItem.upsert({
    where: { userId_eventId: { userId: user.id, eventId } },
    update: data,
    create: { userId: user.id, eventId, ...data },
  });

  revalidatePath("/watchlist", "page");
  revalidatePath("/events/[slug]", "page");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { eventId } = await req.json();

  await prisma.watchListItem.deleteMany({
    where: {
      userId: user.id,
      eventId,
    },
  });

  revalidatePath("/watchlist", "page");
  revalidatePath("/events/[slug]", "page");
  return NextResponse.json({ success: true });
}
