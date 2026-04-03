import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { getPromotionNewsSlug } from "@lib/news";

export async function GET(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const [events, wrestlers, promotions] = await Promise.all([
    prisma.event.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { id: true, title: true, slug: true, promotion: true },
      take: 8,
      orderBy: { date: "desc" },
    }),
    prisma.wrestler.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true },
      take: 8,
      orderBy: { name: "asc" },
    }),
    prisma.promotion.findMany({
      where: {
        OR: [
          { shortName: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, shortName: true, fullName: true },
      take: 8,
      orderBy: { shortName: "asc" },
    }),
  ]);

  return NextResponse.json({
    results: [
      ...events.map((event) => ({
        type: "event",
        id: event.id,
        label: event.title,
        slug: event.slug,
        subtitle: event.promotion,
        shortcode: `[[event:${event.slug}|${event.title}]]`,
      })),
      ...wrestlers.map((wrestler) => ({
        type: "wrestler",
        id: wrestler.id,
        label: wrestler.name,
        slug: wrestler.slug,
        subtitle: "Wrestler",
        shortcode: `[[wrestler:${wrestler.slug}|${wrestler.name}]]`,
      })),
      ...promotions.map((promotion) => ({
        type: "promotion",
        id: promotion.id,
        label: promotion.fullName || promotion.shortName,
        slug: getPromotionNewsSlug(promotion.shortName),
        subtitle: promotion.shortName,
        shortcode: `[[promotion:${getPromotionNewsSlug(promotion.shortName)}|${promotion.fullName || promotion.shortName}]]`,
      })),
    ],
  });
}
