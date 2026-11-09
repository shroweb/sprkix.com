import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { rateLimit, rateLimitedResponse } from "@lib/rate-limit";

const MAX_LEN = 1000;

const authorSelect = { select: { id: true, name: true, slug: true, avatarUrl: true, isAdmin: true } } as const;

/** GET /api/events/[id]/comments: top-level comments (newest first) with their replies (oldest first). */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const comments = await prisma.eventComment.findMany({
      where: { eventId: id, parentId: null },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: authorSelect,
        replies: { orderBy: { createdAt: "asc" }, take: 50, include: { user: authorSelect } },
      },
    });
    return NextResponse.json({ comments });
  } catch {
    return NextResponse.json({ error: "Failed to load comments" }, { status: 500 });
  }
}

/** POST { text, parentId? }: add a comment (or a reply to a top-level comment). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user as any).isSuspended) return NextResponse.json({ error: "Account suspended" }, { status: 403 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const parentId = typeof body.parentId === "string" && body.parentId ? body.parentId : null;
  if (!text) return NextResponse.json({ error: "Comment is empty" }, { status: 400 });
  if (text.length > MAX_LEN) return NextResponse.json({ error: `Max ${MAX_LEN} characters` }, { status: 400 });

  const rl = await rateLimit(`event-comment:${id}:${user.id}`, 10, 60);
  if (!rl.allowed) return rateLimitedResponse(rl.retryAfterSeconds);

  try {
    const event = await prisma.event.findUnique({ where: { id }, select: { id: true } });
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

    if (parentId) {
      const parent = await prisma.eventComment.findUnique({ where: { id: parentId }, select: { eventId: true, parentId: true } });
      // Replies only go one level deep and must belong to the same event.
      if (!parent || parent.eventId !== id || parent.parentId) {
        return NextResponse.json({ error: "Invalid comment to reply to" }, { status: 400 });
      }
    }

    const comment = await prisma.eventComment.create({
      data: { text, eventId: id, userId: user.id, parentId },
      include: { user: authorSelect, replies: { include: { user: authorSelect } } },
    });
    return NextResponse.json({ success: true, comment });
  } catch {
    return NextResponse.json({ error: "Failed to post comment" }, { status: 500 });
  }
}

/** DELETE ?commentId=...: authors can delete their own comments; admins can delete any. */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const commentId = new URL(req.url).searchParams.get("commentId");
  if (!commentId) return NextResponse.json({ error: "commentId required" }, { status: 400 });

  try {
    const comment = await prisma.eventComment.findUnique({ where: { id: commentId }, select: { userId: true, eventId: true } });
    if (!comment || comment.eventId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (comment.userId !== user.id && !(user as any).isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    await prisma.eventComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
