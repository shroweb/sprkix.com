import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";
import { signToken } from "@lib/v1/auth";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { name, email, password } = body;

  if (!name || !email || !password) return err("name, email and password are required");
  if (String(password).length < 8) return err("Password must be at least 8 characters");

  const normalizedEmail = String(email).toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } });
  if (existing) return err("An account with that email already exists", 409);

  const hashed = await bcrypt.hash(String(password), 12);
  const slug = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const user = await prisma.user.create({
    data: {
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashed,
      slug,
    },
    select: {
      id: true,
      email: true,
      name: true,
      slug: true,
      avatarUrl: true,
      isAdmin: true,
      isVerified: true,
      favoritePromotion: true,
      createdAt: true,
    },
  });

  const token = signToken(user.id);
  return ok({ token, user }, undefined, 201);
});
