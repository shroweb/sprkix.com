import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { fetchCagematchEnrichment } from "@lib/enrichment/profightdb";
import { findEventOnTMDB } from "@lib/tmdb";

export const runtime = "nodejs";
export const maxDuration = 300;

type BackfillResult = {
  id: string;
  title: string;
  status: "would-update" | "updated" | "not-found" | "error";
  source?: "cagematch" | "tmdb";
  posterUrl?: string;
  error?: string;
};

/**
 * POST /api/admin/events/backfill-posters
 * Body: { dryRun?: boolean, limit?: number }
 *
 * Defaults to dry-run so an admin can inspect matches before writing them.
 * Existing poster URLs are never overwritten.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun !== false;
  const limit = Math.min(Math.max(Number(body.limit) || 25, 1), 100);

  const events = await prisma.event.findMany({
    where: { OR: [{ posterUrl: null }, { posterUrl: "" }] },
    orderBy: { date: "desc" },
    take: limit,
    select: { id: true, title: true, slug: true, profightdbUrl: true },
  });

  const results: BackfillResult[] = [];

  for (const event of events) {
    try {
      let posterUrl: string | undefined;
      let source: "cagematch" | "tmdb" | undefined;

      if (event.profightdbUrl?.includes("cagematch.net")) {
        try {
          const enrichment = await fetchCagematchEnrichment(event.profightdbUrl);
          if (enrichment?.posterUrl) {
            posterUrl = enrichment.posterUrl;
            source = "cagematch";
          }
        } catch (error) {
          console.warn(`[poster-backfill] Cagematch failed for "${event.title}":`, error);
        }
      }

      if (!posterUrl) {
        const tmdb = await findEventOnTMDB(event.title);
        if (tmdb?.posterUrl) {
          posterUrl = tmdb.posterUrl;
          source = "tmdb";
        }
      }

      if (!posterUrl || !source) {
        results.push({ id: event.id, title: event.title, status: "not-found" });
        continue;
      }

      if (!dryRun) {
        await prisma.event.update({
          where: { id: event.id },
          data: { posterUrl },
        });
        revalidatePath(`/events/${event.slug}`);
      }

      results.push({
        id: event.id,
        title: event.title,
        status: dryRun ? "would-update" : "updated",
        source,
        posterUrl,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[poster-backfill] Failed for "${event.title}":`, error);
      results.push({ id: event.id, title: event.title, status: "error", error: message });
    }
  }

  return NextResponse.json({
    dryRun,
    scanned: events.length,
    recoverable: results.filter((result) => result.status === "would-update" || result.status === "updated").length,
    updated: results.filter((result) => result.status === "updated").length,
    notFound: results.filter((result) => result.status === "not-found").length,
    errors: results.filter((result) => result.status === "error").length,
    results,
  });
}
