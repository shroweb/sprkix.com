import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import bcrypt from "bcrypt";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      slug: true,
      isAdmin: true,
      isSuspended: true,
      createdAt: true,
      _count: { select: { reviews: true, MatchRating: true, followers: true } },
    },
  });

  return NextResponse.json({ users });
}

// POST /api/admin/users — create a new user
export async function POST(req: NextRequest) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email, password, isAdmin } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "name, email and password are required" }, { status: 400 });

  const exists = await prisma.user.findFirst({
    where: { OR: [{ email: { equals: email, mode: "insensitive" } }, { name: { equals: name, mode: "insensitive" } }] },
  });
  if (exists) return NextResponse.json({ error: "Email or username already in use" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  // Generate unique slug from name
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.user.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const user = await prisma.user.create({
    data: { name, email, password: hashed, isAdmin: !!isAdmin, slug },
    select: { id: true, name: true, email: true, isAdmin: true, isSuspended: true, createdAt: true,
      _count: { select: { reviews: true, MatchRating: true, followers: true } } },
  });

  return NextResponse.json({ success: true, user });
}
