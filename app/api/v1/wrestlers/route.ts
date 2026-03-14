import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

const PAGE_SIZE = 40;

export const GET = withErrorHandling(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || PAGE_SIZE)));
  const q = searchParams.get("q");

  const where: any = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  const [total, wrestlers] = await Promise.all([
    prisma.wrestler.count({ where }),
    prisma.wrestler.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        imageUrl: true,
        bio: true,
        _count: { select: { matches: true } },
      },
    }),
  ]);

  return ok(
    wrestlers.map((w) => ({ ...w, matchCount: w._count.matches, _count: undefined })),
    { page, limit, total }
  );
});
