import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET(req: Request) {
  try {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const championships = await prisma.championship.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { matches: true } },
      },
    });

    return NextResponse.json({ championships });
  } catch (err) {
    console.error("Championship fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch championships" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, shortName, promotion, imageUrl } = await req.json();
    if (!title || !promotion) {
      return NextResponse.json({ error: "Title and promotion are required" }, { status: 400 });
    }

    const championship = await prisma.championship.create({
      data: {
        title: title.trim(),
        shortName: shortName?.trim() || undefined,
        promotion: promotion.trim(),
        imageUrl: imageUrl?.trim() || undefined,
      },
    });

    return NextResponse.json({ championship });
  } catch (err) {
    console.error("Championship creation error:", err);
    return NextResponse.json({ error: "Failed to create championship" }, { status: 500 });
  }
}
