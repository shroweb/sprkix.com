import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { token, platform } = body;

  if (!token || typeof token !== "string") return err("token is required");
  if (!platform || !["ios", "android"].includes(platform)) return err("platform must be ios or android");

  await prisma.pushToken.upsert({
    where: { token },
    update: { userId: user.id, platform },
    create: { token, userId: user.id, platform },
  });

  return ok({ registered: true });
});

export const DELETE = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) return err("token query param is required");

  await prisma.pushToken.deleteMany({ where: { userId: user.id, token } });
  return ok({ removed: true });
});
