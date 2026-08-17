import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET(req: Request) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const take = Math.min(parseInt(searchParams.get("take") || "200", 10) || 200, 500);

  const logs = await prisma.adminLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { id: true, name: true, slug: true } },
    },
  });

  return NextResponse.json({ logs });
}
