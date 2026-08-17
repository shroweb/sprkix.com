import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { BADGE_DEFS, badgeDef } from "@lib/badges";
import { logAdminAction } from "@lib/admin-log";

export async function GET() {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [badges, users] = await Promise.all([
    prisma.userBadge.findMany({
      orderBy: { awardedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  // Group holders by badge type
  const byType = BADGE_DEFS.map((def) => ({
    ...def,
    holders: badges
      .filter((b) => b.badgeType === def.type)
      .map((b) => ({
        id: b.id,
        user: b.user,
        awardedAt: b.awardedAt,
      })),
  }));

  return NextResponse.json({ byType, users });
}

export async function POST(req: Request) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { userId, badgeType, action } = await req.json();
  if (!userId || !badgeType || !["award", "revoke"].includes(action)) {
    return NextResponse.json(
      { error: "userId, badgeType and action (award|revoke) are required" },
      { status: 400 },
    );
  }

  const def = badgeDef(badgeType);
  if (!def) return NextResponse.json({ error: "Unknown badge type" }, { status: 400 });

  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeType },
  });

  if (action === "award") {
    if (existing) return NextResponse.json({ error: "Badge already awarded" }, { status: 400 });
    const badge = await prisma.userBadge.create({
      data: { userId, badgeType, title: def.title, icon: def.icon },
    });
    await prisma.notification.create({
      data: {
        userId,
        type: "badge_awarded",
        message: `You earned the ${def.title} badge ${def.icon}`,
        detail: def.description,
        link: "/",
      },
    });
    await logAdminAction(admin.id, "badge_award", {
      targetType: "UserBadge",
      targetId: badge.id,
      detail: `${badgeType} → ${userId}`,
    });
    return NextResponse.json({ success: true, badge });
  }

  // revoke
  if (!existing) return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  await prisma.userBadge.delete({ where: { id: existing.id } });
  await logAdminAction(admin.id, "badge_revoke", {
    targetType: "UserBadge",
    targetId: existing.id,
    detail: `${badgeType} → ${userId}`,
  });
  return NextResponse.json({ success: true });
}
