import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  let user;
  try {
    user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: {
      id: true, name: true, email: true, slug: true, password: true,
      avatarUrl: true, isAdmin: true, isVerified: true, favoritePromotion: true, createdAt: true,
    },
  });
  } catch (err) {
    console.error("Login DB error:", err);
    return NextResponse.json({ error: "Database connection failed. Please try again." }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  if (!user.password) {
    return NextResponse.json(
      { error: "This account uses social login. Please sign in with Google or Facebook." },
      { status: 401 },
    );
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = jwt.sign(
    { userId: user.id, email: user.email, name: user.name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" },
  );

  const response = NextResponse.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      slug: user.slug,
      avatarUrl: user.avatarUrl,
      isAdmin: user.isAdmin,
    },
  });

  // Set cookie for web browser sessions
  response.cookies.set({
    name: "token",
    value: token,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
