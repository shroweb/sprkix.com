import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../lib/server-auth";

// POST /api/lists/[id]/items — add event to list
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { eventId, matchId, note } = await req.json();
  try {
    const item = await prisma.listItem.create({
      data: { listId, eventId: eventId || null, matchId: matchId || null, note: note || null },
      include: {
        event: { select: { id: true, title: true, posterUrl: true, slug: true } },
        match: { select: { id: true, title: true, event: { select: { posterUrl: true, title: true, slug: true } } } },
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Item already in this list" },
      { status: 409 },
    );
  }
}

// PATCH /api/lists/[id]/items — update note or order of a list item
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { itemId, note, order } = await req.json();
  if (!itemId)
    return NextResponse.json({ error: "itemId required" }, { status: 400 });

  const updateData: { note?: string | null; order?: number } = {};
  if (note !== undefined) updateData.note = note || null;
  if (order !== undefined) updateData.order = order;

  const updated = await prisma.listItem.update({
    where: { id: itemId },
    data: updateData,
    include: {
      event: { select: { id: true, title: true, posterUrl: true, slug: true } },
    },
  });
  return NextResponse.json(updated);
}

// DELETE /api/lists/[id]/items?eventId=xxx — remove event from list
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: listId } = await params;
  const list = await prisma.list.findUnique({ where: { id: listId } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get("eventId");
  const matchId = searchParams.get("matchId");
  if (!eventId && !matchId)
    return NextResponse.json({ error: "eventId or matchId required" }, { status: 400 });

  if (matchId) {
    await prisma.listItem.deleteMany({ where: { listId, matchId } });
  } else if (eventId) {
    await prisma.listItem.deleteMany({ where: { listId, eventId } });
  }
  return NextResponse.json({ success: true });
}
