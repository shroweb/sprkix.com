import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // 'followers' | 'following'

  const currentUser = await getUserFromServerCookie();

  let users: { id: string; name: string | null }[] = [];

  if (type === "followers") {
    const follows = await prisma.follow.findMany({
      where: { followingId: id },
      include: { follower: { select: { id: true, name: true } } },
    });
    users = follows.map((f) => f.follower);
  } else if (type === "following") {
    const follows = await prisma.follow.findMany({
      where: { followerId: id },
      include: { following: { select: { id: true, name: true } } },
    });
    users = follows.map((f) => f.following);
  }

  // If logged in, check which of these users the current user follows
  let followingSet: Set<string> = new Set();
  if (currentUser) {
    const myFollows = await prisma.follow.findMany({
      where: {
        followerId: currentUser.id,
        followingId: { in: users.map((u) => u.id) },
      },
      select: { followingId: true },
    });
    followingSet = new Set(myFollows.map((f) => f.followingId));
  }

  return NextResponse.json({
    users: users.map((u) => ({
      ...u,
      isFollowing: followingSet.has(u.id),
      isCurrentUser: currentUser?.id === u.id,
    })),
    currentUserId: currentUser?.id ?? null,
  });
}
