import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (q.length < 2) return err("q must be at least 2 characters");

  const [events, wrestlers, users] = await Promise.all([
    prisma.event.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      take: 10,
      orderBy: { date: "desc" },
      select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true },
    }),
    prisma.wrestler.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true },
    }),
    prisma.user.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      take: 10,
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, avatarUrl: true },
    }),
  ]);

  return ok({ events, wrestlers, users });
});
