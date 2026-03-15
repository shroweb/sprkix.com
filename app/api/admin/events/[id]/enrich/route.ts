import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { enrichFromWikipedia } from "@lib/enrichment/wikipedia";
import { fetchAewEnrichment } from "@lib/enrichment/aew";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

// POST /api/admin/events/[id]/enrich
// body: { source: "wikipedia" | "aew", url?: string, preview?: boolean }
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { source, url, preview = false } = body as {
    source: "wikipedia" | "aew";
    url?: string;
    preview?: boolean;
  };

  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 });

  let enrichment = null;

  if (source === "wikipedia") {
    const year = new Date(event.date).getFullYear();
    enrichment = await enrichFromWikipedia(event.title, year);
  } else if (source === "aew") {
    const aewUrl = url || (event as any).aewUrl;
    if (!aewUrl) return NextResponse.json({ error: "No AEW URL provided" }, { status: 400 });
    enrichment = await fetchAewEnrichment(aewUrl);
  }

  if (!enrichment) {
    return NextResponse.json({ error: "No data found from this source" }, { status: 404 });
  }

  // Preview mode — return what would be applied without saving
  if (preview) {
    return NextResponse.json({ enrichment });
  }

  // Apply — only overwrite fields that are currently blank (don't clobber manual edits)
  const updates: Record<string, any> = {};
  if (enrichment.venue && !(event as any).venue) updates.venue = enrichment.venue;
  if (enrichment.city && !(event as any).city) updates.city = enrichment.city;
  if (enrichment.attendance && !(event as any).attendance) updates.attendance = enrichment.attendance;
  if (enrichment.network && !(event as any).network) updates.network = enrichment.network;
  if (enrichment.description && !event.description) updates.description = enrichment.description;
  if (enrichment.posterUrl && !event.posterUrl) updates.posterUrl = enrichment.posterUrl;
  if (enrichment.sourceUrl) {
    if (source === "wikipedia") updates.wikiUrl = enrichment.sourceUrl;
    if (source === "aew") updates.aewUrl = url || enrichment.sourceUrl;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "Nothing new to apply — all fields already populated", enrichment });
  }

  const updated = await prisma.event.update({ where: { id }, data: updates });
  revalidatePath(`/events/${updated.slug}`);

  return NextResponse.json({ success: true, applied: updates, enrichment });
}
