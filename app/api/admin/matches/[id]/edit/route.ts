import { prisma } from "../../../../../../lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const title = form.get("title") as string;
    const result = form.get("result") as string;
    const type = form.get("type") as string;
    const duration = parseInt(form.get("duration") as string);

    const matchId = req.nextUrl.pathname.split("/").slice(-2)[0];

    if (!matchId) {
      return NextResponse.json({ error: "Missing match ID" }, { status: 400 });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        title,
        result,
        type,
        duration,
      },
    });

    return NextResponse.redirect(new URL("/admin/events", req.url));
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
