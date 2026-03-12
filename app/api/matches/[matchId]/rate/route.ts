import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { jwtVerify } from "jose";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) {
      console.error("[Auth] Missing token");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
      const errorMsg = "[Auth] Missing JWT_SECRET environment variable";
      console.error(errorMsg);
      throw new Error(errorMsg);
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = (payload as any).userId;

    if (!userId) {
      console.error("[Auth] Invalid userId in token payload");
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    const segments = req.nextUrl.pathname.split("/");
    const matchId = segments[segments.indexOf("matches") + 1];

    if (!matchId) {
      console.error("[Params] Missing matchId");
      return NextResponse.json(
        { error: "Match ID not provided" },
        { status: 400 },
      );
    }

    const { rating } = await req.json();
    console.log(`[Rating API] Match: ${matchId}, User: ${userId}, Rating: ${rating}`);

    if (typeof rating !== "number" || rating < 0 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    try {
      const upserted = await prisma.matchRating.upsert({
        where: { userId_matchId: { userId, matchId } },
        update: { rating },
        create: { matchId, userId, rating },
      });
      console.log(`[Rating API] Upserted:`, upserted);

      const allRatings = await prisma.matchRating.findMany({
        where: { matchId },
      });
      console.log(`[Rating API] All ratings for match:`, allRatings.map(r => r.rating));

      const average =
        allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      console.log(`[Rating API] Calculated average: ${average}`);

      await prisma.match.update({
        where: { id: matchId },
        data: { rating: parseFloat(average.toFixed(2)) },
      });

      return NextResponse.json({ success: true, average });
    } catch (dbErr: any) {
      console.error("[DB Error]", dbErr);
      return NextResponse.json(
        { error: "Database operation failed", details: dbErr.message },
        { status: 500 },
      );
    }
  } catch (err: any) {
    console.error("[Rating Error]", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: err.message },
      { status: 500 },
    );
  }
}
