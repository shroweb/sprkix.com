import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { findEventOnTMDB } from "@lib/tmdb";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: Request) {
  try {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const eventsWithMissingPosters = await prisma.event.findMany({
      where: {
        OR: [{ posterUrl: null }, { posterUrl: "" }],
      },
      take: 20,
      select: { id: true, title: true },
    });

    let updatedCount = 0;
    const results: { eventId: string; title: string; posterUrl: string }[] = [];

    for (const ev of eventsWithMissingPosters) {
      try {
        const metadata = await findEventOnTMDB(ev.title);
        if (metadata?.posterUrl) {
          await prisma.event.update({
            where: { id: ev.id },
            data: {
              posterUrl: metadata.posterUrl,
              ...(metadata.description && { description: metadata.description }),
            },
          });
          updatedCount++;
          results.push({ eventId: ev.id, title: ev.title, posterUrl: metadata.posterUrl });
        }
      } catch (err) {
        console.error(`TMDB search error for ${ev.title}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      processed: eventsWithMissingPosters.length,
      updatedCount,
      results,
    });
  } catch (err: any) {
    console.error("Bulk poster repair error:", err);
    return NextResponse.json({ error: err.message || "Bulk repair failed" }, { status: 500 });
  }
}
