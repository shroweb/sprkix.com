import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { targetUserId } = await req.json();
  const currentUser = await getUserFromServerCookie();

  if (!currentUser)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const existing = await prisma.follow.findUnique({
    where: {
      followerId_followingId: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    },
  });

  if (existing) {
    // Unfollow
    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUser.id,
          followingId: targetUserId,
        },
      },
    });
    return NextResponse.json({ followed: false });
  } else {
    // Follow
    await prisma.follow.create({
      data: {
        followerId: currentUser.id,
        followingId: targetUserId,
      },
    });

    // Notify the followed user
    await (prisma as any).notification.create({
      data: {
        userId: targetUserId,
        type: "follow",
        message: `${currentUser.name ?? "Someone"} started following you`,
        link: `/users/${currentUser.slug || currentUser.id}`,
      },
    });

    return NextResponse.json({ followed: true });
  }
}
