import { prisma } from "@lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Max stream lifetime — EventSource auto-reconnects, so closing periodically
// is a cheap way to cycle DB connections on long-running watch parties.
const MAX_STREAM_MS = 30 * 60 * 1000;
const POLL_MS = 2000;
const HEARTBEAT_MS = 15000;

/**
 * GET /api/events/[id]/chat/stream — Server-Sent Events feed for the live
 * watch party chat. First emits the latest 50 comments, then streams new
 * ones as they're posted. Falls back gracefully on the client to polling.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let lastSeenAt = new Date(0);
      const seenIds = new Set<string>();

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          // Client disconnected — throw to stop the loop
          throw new Error("stream closed");
        }
      };

      const fetchNewComments = async () => {
        // 1ms overlap + id dedupe so same-millisecond comments aren't dropped
        const since = new Date(lastSeenAt.getTime() - 1);
        const comments = await prisma.liveComment.findMany({
          where: { eventId: id, createdAt: { gt: since } },
          include: {
            user: { select: { name: true, avatarUrl: true, isAdmin: true } },
          },
          orderBy: { createdAt: "asc" },
          take: 100,
        });

        const fresh = comments.filter((c) => !seenIds.has(c.id));
        if (fresh.length > 0) {
          for (const c of fresh) seenIds.add(c.id);
          lastSeenAt = fresh[fresh.length - 1].createdAt;
          send({ type: "comments", comments: fresh });
        }
      };

      const startedAt = Date.now();
      let lastHeartbeat = Date.now();

      try {
        await fetchNewComments();
        while (Date.now() - startedAt < MAX_STREAM_MS) {
          await new Promise((r) => setTimeout(r, POLL_MS));
          try {
            await fetchNewComments();
          } catch (err) {
            break;
          }
          if (Date.now() - lastHeartbeat > HEARTBEAT_MS) {
            controller.enqueue(encoder.encode(`: ping\n\n`));
            lastHeartbeat = Date.now();
          }
        }
      } catch {
        // Stream closed (client gone or send failed)
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
