import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";

// GET /api/lists — current user's lists
export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const lists = await prisma.list.findMany({
    where: { userId: user.id },
    include: {
      items: {
        include: {
          event: {
            select: { id: true, title: true, posterUrl: true, slug: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(lists);
}

// POST /api/lists — create a new list
export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { title, description, isPublic } = await req.json();
  if (!title?.trim())
    return NextResponse.json({ error: "Title required" }, { status: 400 });

  const list = await prisma.list.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      isPublic: isPublic ?? true,
      userId: user.id,
    },
  });
  return NextResponse.json(list, { status: 201 });
}
