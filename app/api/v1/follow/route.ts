import { NextRequest } from "next/server";
import { requireAuth } from "@lib/v1/auth";
import { prisma } from "@lib/prisma";
import { ok, err, preflight, withErrorHandling } from "@lib/v1/response";
import { sendFollowEmail } from "@lib/mail";

export const OPTIONS = () => preflight();

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await requireAuth(req);
  const body = await req.json().catch(() => ({}));
  const { targetUserId } = body;

  if (!targetUserId) return err("targetUserId is required");
  if (targetUserId === user.id) return err("You cannot follow yourself");

  const target = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true, slug: true } });
  if (!target) return err("User not found", 404);

  const existing = await prisma.follow.findFirst({
    where: { followerId: user.id, followingId: targetUserId },
    select: { id: true },
  });

  if (existing) {
    await prisma.follow.deleteMany({ where: { followerId: user.id, followingId: targetUserId } });
    return ok({ followed: false });
  } else {
    await prisma.follow.create({ data: { followerId: user.id, followingId: targetUserId } });
    await (prisma as any).notification.create({
      data: {
        userId: targetUserId,
        type: "follow",
        message: `${user.name ?? "Someone"} started following you`,
        link: user.slug ? `/users/${user.slug}` : undefined,
      },
    });

    // Also send an email
    try {
      const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
      if (targetUser && targetUser.emailNotifications !== false) {
        await sendFollowEmail(
          targetUser.email, 
          targetUser.name ?? "Wrestling Fan", 
          user.name ?? "Someone", 
          user.slug || ""
        );
      }
    } catch (emailErr) {
      console.error("Email failed for follow:", emailErr);
    }

    return ok({ followed: true });
  }
});
