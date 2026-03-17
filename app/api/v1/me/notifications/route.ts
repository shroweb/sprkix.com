import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, preflight, withErrorHandling } from "@lib/v1/response";

export const OPTIONS = () => preflight();

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Mark all as read
  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return ok(notifications);
});
