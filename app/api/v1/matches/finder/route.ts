import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const minRating = parseFloat(searchParams.get("minRating") || "0");
    const promotion = searchParams.get("promotion") || "";
    const year = searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined;
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));

    const whereClause: any = {
      rating: { gte: minRating > 0 ? minRating : 0 },
    };

    if (promotion) {
      whereClause.event = { promotion: { equals: promotion, mode: "insensitive" } };
    }

    if (year) {
      const startDate = new Date(`${year}-01-01`);
      const endDate = new Date(`${year}-12-31T23:59:59`);
      whereClause.event = {
        ...whereClause.event,
        date: { gte: startDate, lte: endDate },
      };
    }

    const [matches, totalCount] = await Promise.all([
      prisma.match.findMany({
        where: whereClause,
        orderBy: { rating: "desc" },
        take: limit,
        skip: (page - 1) * limit,
        include: {
          participants: {
            include: { wrestler: true },
          },
          event: {
            select: {
              id: true,
              title: true,
              slug: true,
              promotion: true,
              date: true,
              posterUrl: true,
            },
          },
        },
      }),
      prisma.match.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      matches,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    console.error("Match finder API error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
