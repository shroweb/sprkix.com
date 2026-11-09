import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getAllCurrentChampions } from "@lib/champions";

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 2) {
    return NextResponse.json({ events: [], wrestlers: [], users: [], promotions: [], titles: [] });
  }
  const needle = q.toLowerCase();

  const [events, wrestlers, users, promotions, lineal] = await Promise.all([
    prisma.event.findMany({
      where: {
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { promotion: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, title: true, slug: true, posterUrl: true, promotion: true, date: true },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.wrestler.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { aliases: { some: { alias: { contains: q, mode: "insensitive" } } } },
        ],
      },
      select: { id: true, name: true, slug: true, imageUrl: true },
      take: 5,
    }),
    prisma.user.findMany({
      where: { name: { contains: q, mode: "insensitive" } },
      select: { id: true, name: true, slug: true, avatarUrl: true },
      take: 4,
    }),
    prisma.promotion.findMany({
      where: {
        OR: [
          { shortName: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, shortName: true, fullName: true, logoUrl: true },
      take: 3,
    }),
    prisma.linealTitle.findMany({
      where: { isActive: true, name: { contains: q, mode: "insensitive" } },
      select: { slug: true, name: true },
      take: 3,
    }),
  ]);

  const champs = getAllCurrentChampions()
    .filter((c) => c.title.toLowerCase().includes(needle) || (c.shortName ?? "").toLowerCase() === needle)
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      title: c.title,
      promotion: c.promotion,
      photoUrl: c.photoUrl,
      holder: c.champions.map((p) => p.name).join(" & "),
      href: "/champions",
    }));

  const titles = [
    ...champs,
    ...lineal.map((l) => ({
      id: `lineal-${l.slug}`,
      title: `${l.name} (Lineal)`,
      promotion: "Lineal",
      photoUrl: null,
      holder: "",
      href: `/lineal/${l.slug}`,
    })),
  ].slice(0, 5);

  return NextResponse.json({
    events,
    wrestlers,
    users,
    promotions: promotions.map((p) => ({ ...p, slug: slugify(p.shortName) })),
    titles,
  });
}
