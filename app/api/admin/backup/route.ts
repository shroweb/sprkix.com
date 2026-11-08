import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [events, wrestlers, reviews, championships, promotions] = await Promise.all([
      prisma.event.findMany({
        take: 1000,
        include: { matches: { include: { participants: true } } },
      }),
      prisma.wrestler.findMany({ take: 1000 }),
      prisma.review.findMany({ take: 1000 }),
      prisma.championship.findMany(),
      prisma.promotion.findMany(),
    ]);

    const backupData = {
      exportedAt: new Date().toISOString(),
      counts: {
        events: events.length,
        wrestlers: wrestlers.length,
        reviews: reviews.length,
        championships: championships.length,
        promotions: promotions.length,
      },
      events,
      wrestlers,
      reviews,
      championships,
      promotions,
    };

    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="poison_rana_backup_${Date.now()}.json"`,
      },
    });
  } catch (err: any) {
    console.error("Backup export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
