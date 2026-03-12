import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { importMatchesFromCagematch } from "../../../../lib/cagematch";

export async function POST(req: Request) {
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
      },
    });

    // Auto-import matches if URL is present and matches Cagematch pattern
    if (body.profightdbUrl && body.profightdbUrl.includes("cagematch.net")) {
      try {
        await importMatchesFromCagematch(newEvent.id, body.profightdbUrl);
      } catch (importErr) {
        console.error(
          "❌ Error auto-importing matches from Cagematch:",
          importErr,
        );
        // We still return success for the event creation
      }
    }

    return NextResponse.json({ success: true, id: newEvent.id });
  } catch (error) {
    console.error("❌ Error adding event:", error);
    return NextResponse.json(
      { success: false, error: "Error adding event" },
      { status: 500 },
    );
  }
}
