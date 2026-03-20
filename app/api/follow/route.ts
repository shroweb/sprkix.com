import { prisma } from "../../../lib/prisma";
import { getUserFromServerCookie } from "../../../lib/server-auth";
import { NextResponse } from "next/server";
import { sendFollowEmail } from "../../../lib/mail";

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

    // Notify the followed user in DB
    await (prisma as any).notification.create({
      data: {
        userId: targetUserId,
        type: "follow",
        message: `${currentUser.name ?? "Someone"} started following you`,
        link: `/users/${currentUser.slug || currentUser.id}`,
      },
    });

    // Also send an email
    try {
      const targetUser = await prisma.user.findUnique({ 
        where: { id: targetUserId },
        select: { email: true, name: true, emailNotifications: true }
      });
      if (targetUser && targetUser.emailNotifications !== false) {
        await sendFollowEmail(
          targetUser.email, 
          targetUser.name ?? "Wrestling Fan", 
          currentUser.name ?? "Someone", 
          currentUser.slug || currentUser.id
        );
      }
    } catch (emailErr) {
      console.error("Email failed for follow:", emailErr);
    }

    return NextResponse.json({ followed: true });
  }
}
