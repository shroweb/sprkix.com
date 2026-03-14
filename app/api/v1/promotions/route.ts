import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (_req: NextRequest) => {
  const [promotions, eventCounts] = await Promise.all([
    prisma.promotion.findMany({
      orderBy: { shortName: "asc" },
      select: {
        id: true,
        shortName: true,
        fullName: true,
        logoUrl: true,
        aliases: { select: { id: true, fullName: true } },
      },
    }),
    // Count events per promotion (promotion is a string field on Event)
    prisma.event.groupBy({
      by: ["promotion"],
      _count: { id: true },
    }),
  ]);

  const countMap = Object.fromEntries(
    eventCounts.map((e) => [e.promotion.toLowerCase(), e._count.id])
  );

  return ok(
    promotions.map((p) => ({
      ...p,
      eventCount: countMap[p.shortName.toLowerCase()] ?? 0,
    }))
  );
});
