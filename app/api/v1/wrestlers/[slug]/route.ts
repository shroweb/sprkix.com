import { NextRequest } from "next/server";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (_req: NextRequest, ctx: any) => {
  const { slug } = ctx.params;

  const wrestler = await prisma.wrestler.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      imageUrl: true,
      bio: true,
      createdAt: true,
      matches: {
        orderBy: { match: { event: { date: "desc" } } },
        take: 50,
        select: {
          id: true,
          team: true,
          isWinner: true,
          match: {
            select: {
              id: true,
              title: true,
              type: true,
              rating: true,
              duration: true,
              order: true,
              event: {
                select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true },
              },
            },
          },
        },
      },
    },
  });

  if (!wrestler) return err("Wrestler not found", 404);

  return ok(wrestler);
});
