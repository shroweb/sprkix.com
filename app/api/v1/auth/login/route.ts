import { NextRequest } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@lib/prisma";
import { signToken } from "@lib/v1/auth";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest) => {
  const body = await req.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password) return err("email and password are required");

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
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
      password: true,
    },
  });

  if (!user) return err("Invalid email or password", 401);

  const valid = await bcrypt.compare(String(password), user.password);
  if (!valid) return err("Invalid email or password", 401);

  const token = signToken(user.id);
  const { password: _pw, ...safeUser } = user;

  return ok({ token, user: safeUser });
});
