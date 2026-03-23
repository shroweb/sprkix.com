import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

const DEADLINE = new Date("2026-06-27T23:59:59Z");

// POST /api/admin/backfill-founding-members
// Grants founding member to all users created before the deadline
export async function POST() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const result = await prisma.user.updateMany({
    where: { createdAt: { lte: DEADLINE }, isFoundingMember: false },
    data: { isFoundingMember: true },
  });

  return NextResponse.json({ success: true, updated: result.count });
}
