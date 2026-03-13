import { prisma } from "../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Attempt to add the columns if they don't exist
    // We use executeRawUnsafe because executeRaw doesn't support parameterized identifiers for DDL
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "enableWatchParty" BOOLEAN NOT NULL DEFAULT true`);
    await prisma.$executeRawUnsafe(`ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "enablePredictions" BOOLEAN NOT NULL DEFAULT true`);
    
    return NextResponse.json({ success: true, message: "Database columns added successfully" });
  } catch (error: any) {
    console.error("Migration error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}
