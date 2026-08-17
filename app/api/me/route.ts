import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { SESSION_USER_SELECT } from "@lib/session-user";
import { verifyToken } from "../../../lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = await verifyToken<{ userId?: string }>(token);
    const userId = decoded?.userId;
    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
      select: SESSION_USER_SELECT,
    });

    if (!user) return NextResponse.json({ user: null });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.json({ user: null });
  }
}
