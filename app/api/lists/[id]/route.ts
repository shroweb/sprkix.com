import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../lib/server-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, slug: true } },
      items: {
        include: {
          event: {
            select: {
              id: true,
              title: true,
              posterUrl: true,
              slug: true,
              promotion: true,
              date: true,
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });
  if (!list) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Private lists are only visible to their owner
  if (!list.isPublic) {
    const requestUser = await getUserFromServerCookie();
    if (!requestUser || requestUser.id !== list.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  return NextResponse.json(list);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { title, description, isPublic } = await req.json();
  const updated = await prisma.list.update({
    where: { id },
    data: { title, description, isPublic },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const list = await prisma.list.findUnique({ where: { id } });
  if (!list || list.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.list.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
