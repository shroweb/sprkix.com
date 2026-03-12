import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ events: [], wrestlers: [] });
  }

  const [events, wrestlers, users] = await Promise.all([
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { promotion: { contains: q, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        posterUrl: true,
        promotion: true,
        date: true,
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.wrestler.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true, imageUrl: true },
      take: 5,
    }),
    prisma.user.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true, avatarUrl: true },
      take: 4,
    }),
  ]);

  return NextResponse.json({ events, wrestlers, users });
}
