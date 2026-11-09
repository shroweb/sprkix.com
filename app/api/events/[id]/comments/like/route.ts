import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { rateLimit, rateLimitedResponse } from "@lib/rate-limit";

/** POST { commentId }: toggle the current user's like on a comment. Returns { liked, likeCount }. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const commentId = typeof body.commentId === "string" ? body.commentId : "";
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  const rl = await rateLimit(`comment-like:${user.id}`, 60, 60);
  if (!rl.allowed) return rateLimitedResponse(rl.retryAfterSeconds);

  try {
    const comment = await prisma.eventComment.findUnique({ where: { id: commentId }, select: { eventId: true } });
    if (!comment || comment.eventId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const key = { commentId_userId: { commentId, userId: user.id } };
    const existing = await prisma.eventCommentLike.findUnique({ where: key });
    if (existing) await prisma.eventCommentLike.delete({ where: key });
    else await prisma.eventCommentLike.create({ data: { commentId, userId: user.id } });

    const likeCount = await prisma.eventCommentLike.count({ where: { commentId } });
    return NextResponse.json({ liked: !existing, likeCount });
  } catch {
    return NextResponse.json({ error: "Failed to update like" }, { status: 500 });
  }
}
