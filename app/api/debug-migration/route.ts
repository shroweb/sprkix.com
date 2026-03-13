import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Add the watchlist column if it doesn't exist
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "WatchListItem" ADD COLUMN IF NOT EXISTS "watchlist" BOOLEAN NOT NULL DEFAULT true;
    `);
    return NextResponse.json({ success: "Database column added successfully" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
