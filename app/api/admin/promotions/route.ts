import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../lib/server-auth";

export async function GET() {
  const promotions = await prisma.promotion.findMany({
    include: { aliases: true },
    orderBy: { shortName: "asc" },
  });
  return NextResponse.json(promotions);
}

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shortName, fullName } = await req.json();
  if (!shortName)
    return NextResponse.json({ error: "shortName required" }, { status: 400 });

  const promo = await prisma.promotion.create({
    data: {
      shortName: shortName.trim(),
      fullName: fullName?.trim() || null,
      aliases: fullName?.trim()
        ? {
            create: { fullName: fullName.trim() },
          }
        : undefined,
    },
    include: { aliases: true },
  });
  return NextResponse.json(promo);
}
