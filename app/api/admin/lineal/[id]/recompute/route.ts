import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { recomputeLinealTitle } from "@lib/lineal-data";
import { logAdminAction } from "@lib/admin-log";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;

  const result = await recomputeLinealTitle(id);
  if (!result) return NextResponse.json({ error: "Title not found or has no seed reign" }, { status: 404 });

  // Enrich review items with the event/match so they can be resolved.
  const matches = result.reviews.length
    ? await prisma.match.findMany({
        where: { id: { in: result.reviews.map((r) => r.matchId) } },
        select: { id: true, title: true, type: true, event: { select: { id: true, title: true, date: true } }, participants: { select: { isWinner: true, wrestler: { select: { name: true } } } } },
      })
    : [];
  const reviews = result.reviews.map((r) => {
    const m = matches.find((x) => x.id === r.matchId);
    return {
      matchId: r.matchId,
      reason: r.reason,
      at: r.at,
      matchTitle: m ? m.title || m.type || "Match" : "Match",
      eventId: m?.event.id ?? null,
      eventTitle: m?.event.title ?? null,
      names: m ? m.participants.map((p) => p.wrestler.name).join(" vs ") : "",
    };
  });

  await logAdminAction(user.id, "lineal.recompute", {
    targetType: "LinealTitle",
    targetId: id,
    detail: `${result.slug}: ${result.reigns} reigns, holder ${result.currentHolder ?? "?"}${result.holderChanged ? " (changed)" : ""}`,
  });
  return NextResponse.json({ success: true, result: { ...result, reviews } });
}
