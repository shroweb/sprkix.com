import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { logAdminAction } from "@lib/admin-log";

export async function POST() {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Recompute each user's denormalized predictionScore/predictionCount from
  // scratch — repairs drift caused by results saved outside the resolve path.
  const [correctAgg, resolvedAgg] = await Promise.all([
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { isCorrect: true },
      _count: { _all: true },
    }),
    prisma.prediction.groupBy({
      by: ["userId"],
      where: { isCorrect: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const correctByUser = new Map(correctAgg.map((r) => [r.userId, r._count._all]));
  const resolvedByUser = new Map(resolvedAgg.map((r) => [r.userId, r._count._all]));

  const userIds = new Set([...correctByUser.keys(), ...resolvedByUser.keys()]);
  let updated = 0;
  for (const userId of userIds) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        predictionScore: correctByUser.get(userId) ?? 0,
        predictionCount: resolvedByUser.get(userId) ?? 0,
      },
    });
    updated++;
  }

  await logAdminAction(admin.id, "recompute_predictions", {
    detail: `${updated} users updated`,
  });

  return NextResponse.json({ success: true, usersUpdated: updated });
}
