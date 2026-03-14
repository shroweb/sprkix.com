import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

// GET /api/admin/matches?q=&page=1&limit=30
export async function GET(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "30"));
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { event: { title: { contains: q, mode: "insensitive" as const } } },
          { participants: { some: { wrestler: { name: { contains: q, mode: "insensitive" as const } } } } },
        ],
      }
    : {};

  const [matches, total] = await Promise.all([
    prisma.match.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ event: { date: "desc" } }, { order: "asc" }],
      include: {
        event: { select: { id: true, title: true, slug: true, date: true, promotion: true } },
        participants: {
          include: { wrestler: { select: { id: true, name: true, imageUrl: true, slug: true } } },
        },
        ratings: { select: { rating: true } },
      },
    }),
    prisma.match.count({ where }),
  ]);

  return NextResponse.json({ matches, total, page, limit });
}
