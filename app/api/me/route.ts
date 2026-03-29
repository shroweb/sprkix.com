import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";
import { SESSION_USER_SELECT } from "@lib/session-user";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;

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
