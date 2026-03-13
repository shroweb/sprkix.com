import { NextResponse } from "next/server";
// Forced recompile - v2
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { matchId } = await req.json();

    if (!matchId) {
      return NextResponse.json({ error: "Match ID required" }, { status: 400 });
    }

    // Check if already favorited
    const existing = await prisma.favoriteMatch.findUnique({
      where: {
        userId_matchId: {
          userId: user.id,
          matchId: matchId,
        },
      },
    });

    if (existing) {
      // Toggle off: Remove favorite
      await prisma.favoriteMatch.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ favorited: false });
    } else {
      // Toggle on: Add favorite
      await prisma.favoriteMatch.create({
        data: {
          userId: user.id,
          matchId: matchId,
        },
      });
      return NextResponse.json({ favorited: true });
    }
  } catch (error) {
    console.error("Favorite match error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
