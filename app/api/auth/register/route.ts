import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendWelcomeEmail } from "../../../../lib/mail";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
    if (existing) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    const nameTaken = await prisma.user.findFirst({
      where: { name: { equals: name.trim(), mode: "insensitive" } },
    });
    if (nameTaken) {
      return NextResponse.json({ error: "That username is already taken. Please choose another." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const slug =
      name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") +
      "-" +
      Math.random().toString(36).substring(2, 6);

    // Founding member — anyone who signs up before the app launch on April 27 2026
    const FOUNDING_MEMBER_DEADLINE = new Date("2026-06-27T23:59:59Z");
    const isFoundingMember = new Date() <= FOUNDING_MEMBER_DEADLINE;

    const user = await prisma.user.create({
      data: { name: name.trim(), email: trimmedEmail, password: hashed, slug, isFoundingMember },
    });

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name || "");

    // Automatically log in the user
    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name || "" },
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
      },
    });

    response.cookies.set({
      name: "token",
      value: token,
      path: "/",
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}

