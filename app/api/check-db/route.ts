import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const eventColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Event'
    `;
    const userColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'User'
    `;
    const watchlistColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'WatchListItem'
    `;
    return NextResponse.json({ success: true, eventColumns, userColumns, watchlistColumns });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
