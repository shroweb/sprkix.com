import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to add the columns if they don't exist
    // We use executeRawUnsafe because executeRaw doesn't support parameterized identifiers for DDL
    const logs: string[] = [];
    
    const run = async (sql: string) => {
      try {
        await prisma.$executeRawUnsafe(sql);
        logs.push(`SUCCESS: ${sql}`);
      } catch (e: any) {
        logs.push(`FAILED: ${sql} - ${e.message}`);
      }
    };

    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "enableWatchParty" BOOLEAN NOT NULL DEFAULT true`);
    await run(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "enablePredictions" BOOLEAN NOT NULL DEFAULT true`);
    await run(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileThemeEventId" TEXT`);
    await run(`ALTER TABLE "WatchListItem" ADD COLUMN IF NOT EXISTS "watchlist" BOOLEAN NOT NULL DEFAULT true`);
    await run(`ALTER TABLE "WatchListItem" ADD COLUMN IF NOT EXISTS "watched" BOOLEAN NOT NULL DEFAULT false`);
    await run(`ALTER TABLE "WatchListItem" ADD COLUMN IF NOT EXISTS "attended" BOOLEAN NOT NULL DEFAULT false`);
    
    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
