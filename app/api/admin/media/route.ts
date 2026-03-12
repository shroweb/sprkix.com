import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../lib/server-auth";

export async function GET(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor") || undefined;
  const take = 48;

  const items = await prisma.mediaItem.findMany({
    orderBy: { createdAt: "desc" },
    take,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
  });

  return NextResponse.json({
    items,
    nextCursor: items.length === take ? items[items.length - 1].id : null,
  });
}

export async function DELETE(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const item = await prisma.mediaItem.findUnique({ where: { id } });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Delete file from disk
  try {
    const { unlink } = await import("fs/promises");
    const { join } = await import("path");
    await unlink(join(process.cwd(), "public", item.url));
  } catch {
    /* file may already be gone */
  }

  await prisma.mediaItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
