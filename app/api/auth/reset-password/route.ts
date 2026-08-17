import { prisma } from "../../../../lib/prisma";
import { NextResponse } from "next/server";
import { verifyToken } from "../../../../lib/jwt";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "Missing token or password" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    // Verify and decode the reset token
    const payload = await verifyToken<{ userId: string; email: string; purpose: string }>(token);
    if (!payload) {
      return NextResponse.json({ error: "Reset link is invalid or has expired" }, { status: 400 });
    }

    if (payload.purpose !== "reset") {
      return NextResponse.json({ error: "Invalid reset token" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
