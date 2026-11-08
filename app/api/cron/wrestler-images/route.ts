import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { findWrestlerImage } from "@lib/wrestler-images";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Fill in missing wrestler photos from TMDB, in small batches.
 *   ?limit=12      wrestlers per call (default 12, max 25)
 *   ?after=<id>    cursor: continue after this wrestler id (response gives nextAfter)
 *   ?dry=1         report matches without saving
 * Protected by CRON_SECRET (fails closed).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = new URL(req.url).searchParams;
  const limit = Math.min(25, Math.max(1, parseInt(sp.get("limit") || "12", 10) || 12));
  const after = sp.get("after");
  const dry = sp.get("dry") === "1";

  const batch = await prisma.wrestler.findMany({
    where: { imageUrl: null, ...(after ? { id: { gt: after } } : {}) },
    orderBy: { id: "asc" },
    take: limit,
    select: { id: true, name: true },
  });

  const results: { name: string; matched: boolean; reason: string; imageUrl?: string }[] = [];
  for (const w of batch) {
    try {
      const found = await findWrestlerImage(w.name);
      if (found.imageUrl && !dry) {
        await prisma.wrestler.update({ where: { id: w.id }, data: { imageUrl: found.imageUrl } });
      }
      results.push({ name: w.name, matched: !!found.imageUrl, reason: found.reason, imageUrl: found.imageUrl ?? undefined });
    } catch (err) {
      results.push({ name: w.name, matched: false, reason: `error: ${err instanceof Error ? err.message : String(err)}` });
    }
  }

  return NextResponse.json({
    dry,
    processed: batch.length,
    matched: results.filter((r) => r.matched).length,
    nextAfter: batch.length === limit ? batch[batch.length - 1].id : null,
    results,
  });
}
