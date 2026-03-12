import { prisma } from "../../../../lib/prisma";
import bcrypt from "bcrypt";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { name, email, password } = await req.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing)
    return NextResponse.json({ error: "User exists" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const slug =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
    "-" +
    Math.random().toString(36).substring(2, 6);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, slug },
  });

  return NextResponse.json({ user });
}
