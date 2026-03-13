import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { importMatchesFromCagematch } from "../../../../lib/cagematch";
import { getUserFromServerCookie } from "../../../../lib/server-auth";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const newEvent = await prisma.event.create({
      data: {
        title: body.title,
        slug: body.slug,
        date: new Date(body.date),
        promotion: body.promotion,
        venue: body.venue || null,
        posterUrl: body.posterUrl || null,
        description: body.description || null,
        profightdbUrl: body.profightdbUrl || null,
        type: body.type || "tv",
        tmdbId: body.tmdbId ? parseInt(body.tmdbId) : null,
        startTime: body.startTime ? new Date(body.startTime) : null,
        endTime: body.endTime ? new Date(body.endTime) : null,
        enableWatchParty: body.enableWatchParty !== false,
        enablePredictions: body.enablePredictions !== false,
      },
    });

    // Auto-import matches if URL is present and matches Cagematch/ProfightDB pattern
    const importUrl = body.profightdbUrl;
    if (importUrl && (importUrl.includes("cagematch.net") || importUrl.includes("profightdb.com"))) {
      try {
        await importMatchesFromCagematch(newEvent.id, importUrl);
      } catch (importErr) {
        console.error(
          "❌ Error auto-importing matches:",
          importErr,
        );
        // We still return success for the event creation
      }
    }

    return NextResponse.json({ success: true, id: newEvent.id, slug: newEvent.slug });
  } catch (error) {
    console.error("❌ Error adding event:", error);
    return NextResponse.json(
      { success: false, error: "Error adding event" },
      { status: 500 },
    );
  }
}
