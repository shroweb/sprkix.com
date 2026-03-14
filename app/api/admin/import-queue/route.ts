import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { importMatchesFromCagematch } from "@lib/cagematch";
import { fetchCagematchEventInfo } from "@lib/cagematch-info";
import { uniqueEventSlug } from "@lib/slug-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// POST /api/admin/import-queue
// body: { url: string }
export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const absoluteUrl = url.startsWith("http") ? url : `https://www.cagematch.net${url}`;

  try {
    // Check if event with this URL already exists
    let event = await prisma.event.findFirst({ where: { profightdbUrl: absoluteUrl } });

    if (!event) {
      // Fetch event info
      const info = await fetchCagematchEventInfo(absoluteUrl);
      const title = info?.title || absoluteUrl;
      const slug = await uniqueEventSlug(title);

      event = await prisma.event.create({
        data: {
          title,
          slug,
          date: info?.date ? new Date(info.date) : new Date(),
          promotion: info?.promotion || "Unknown",
          posterUrl: info?.posterUrl || null,
          profightdbUrl: absoluteUrl,
          type: info?.type || "ppv",
        },
      });
    }

    // Count wrestlers before import to calculate how many were created
    const wrestlerCountBefore = await prisma.wrestler.count();
    const matchCountBefore = await prisma.match.count({ where: { eventId: event.id } });

    // Import matches (returns void)
    await importMatchesFromCagematch(event.id, absoluteUrl);

    const wrestlerCountAfter = await prisma.wrestler.count();
    const matchCountAfter = await prisma.match.count({ where: { eventId: event.id } });

    return NextResponse.json({
      success: true,
      eventId: event.id,
      eventTitle: event.title,
      matchCount: matchCountAfter - matchCountBefore,
      wrestlersCreated: wrestlerCountAfter - wrestlerCountBefore,
    });
  } catch (e: any) {
    console.error("[import-queue]", e);
    return NextResponse.json({ error: e?.message || "Import failed" }, { status: 500 });
  }
}
