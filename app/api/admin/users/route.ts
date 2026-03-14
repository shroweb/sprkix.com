import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      isSuspended: true,
      createdAt: true,
      _count: { select: { reviews: true, MatchRating: true, followers: true } },
    },
  });

  return NextResponse.json({ users });
}
