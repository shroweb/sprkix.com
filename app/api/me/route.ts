import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) {
      console.log("No token found");
      return NextResponse.json({ user: null });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    console.log("Decoded userId:", userId);

    const user = await prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      console.log("User not found");
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("JWT verification failed:", error);
    return NextResponse.json({ user: null });
  }
}
