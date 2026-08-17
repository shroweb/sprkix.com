import { prisma } from "@lib/prisma";
import { signToken as jwtSign, verifyToken } from "@lib/jwt";
import type { NextRequest } from "next/server";

export type V1User = {
  id: string;
  email: string;
  name: string;
  slug: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isVerified: boolean;
  favoritePromotion: string | null;
  createdAt: Date;
  predictionScore: number;
  predictionCount: number;
};

/**
 * Extract and verify a Bearer token from the Authorization header.
 * Returns the authenticated user or null.
 */
export async function getUserFromBearer(req: NextRequest): Promise<V1User | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7).trim();
  if (!token) return null;

  try {
    const decoded = await verifyToken<{ userId?: string }>(token);
    if (!decoded?.userId || typeof decoded.userId !== "string") return null;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
        predictionScore: true,
        predictionCount: true,
      },
    });

    return user as V1User | null;
  } catch {
    return null;
  }
}

/**
 * Require authentication — returns user or throws a 401 response payload.
 */
export async function requireAuth(req: NextRequest): Promise<V1User> {
  const user = await getUserFromBearer(req);
  if (!user) throw { status: 401, message: "Unauthorized — provide a Bearer token" };
  return user;
}

/**
 * Sign a JWT for the given userId (used in login/register responses).
 */
export function signToken(userId: string): Promise<string> {
  return jwtSign({ userId }, "30d");
}
