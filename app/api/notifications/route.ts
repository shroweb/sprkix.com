import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ notifications: [], count: 0 });

  // Fetch all stored notifications
  const stored = await (prisma as any).notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  // Enrich follow notifications with follower avatars
  const followerIds = stored
    .filter((n: any) => n.type === "follow" && n.link?.startsWith("/users/"))
    .map((n: any) => n.link.split("/users/")[1]);

  // Also enrich reply notifications with replier avatars if we can track them
  // (In the future we might want to store 'actorId' in Notification table,
  // but for now we can try to parse from the link if it's consistent)
  
  const followers =
    followerIds.length > 0
      ? await prisma.user.findMany({
          where: {
            OR: [
              { id: { in: followerIds } },
              { slug: { in: followerIds } }
            ]
          },
          select: { id: true, name: true, slug: true, avatarUrl: true },
        })
      : [];
      
  const actorMap = Object.fromEntries([
    ...followers.map((f: any) => [f.id, f]),
    ...followers.map((f: any) => [f.slug, f])
  ]);

  const notifications = stored.map((n: any) => {
    const actorId = n.type === "follow" ? n.link?.split("/users/")[1] : null;
    const actor = actorId ? actorMap[actorId] : null;
    return {
      id: n.id,
      type: n.type,
      message: n.message,
      detail: n.detail,
      link: n.link,
      avatarUrl: actor?.avatarUrl ?? null,
      avatarName: actor?.name ?? null,
      createdAt: n.createdAt,
      isNew: !n.read,
    };
  });

  const count = notifications.filter((n: any) => n.isNew).length;

  return NextResponse.json({ notifications, count });
}

// Mark all as read
export async function POST() {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await (prisma as any).notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}
