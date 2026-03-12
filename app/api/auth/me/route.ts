import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET() {
  const session = await getUserFromServerCookie();
  if (!session) return NextResponse.json({ user: null });

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      slug: true,
      favoritePromotion: true,
    },
  });

  return NextResponse.json({ user });
}
