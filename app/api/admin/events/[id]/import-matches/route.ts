import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../lib/server-auth";
import { parseCagematchHtml } from "../../../../../../lib/cagematch";

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { url } = await req.json();

  if (!url?.trim()) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch Cagematch page");
    const html = await res.text();
    const parsedMatches = await parseCagematchHtml(html);

    const existingWrestlers = await prisma.wrestler.findMany();
    const wrestlerByName = new Map(
      existingWrestlers.map((w) => [w.name.toLowerCase(), w]),
    );

    let wrestlersMatched = 0;
    let wrestlersCreated = 0;
    const createdNames: string[] = [];

    for (const parsed of parsedMatches) {
      const participants = [];

      for (let i = 0; i < parsed.wrestlers.length; i++) {
        const rawName = parsed.wrestlers[i];
        const key = rawName.toLowerCase();
        let wrestler = wrestlerByName.get(key);

        if (!wrestler) {
          for (const [k, w] of wrestlerByName) {
            if (k.includes(key) || key.includes(k)) {
              wrestler = w;
              break;
            }
          }
        }

        if (wrestler) {
          wrestlersMatched++;
        } else {
          wrestler = await prisma.wrestler.create({
            data: { name: rawName, slug: `${slugify(rawName)}-${Date.now()}` },
          });
          wrestlerByName.set(key, wrestler);
          wrestlersCreated++;
          createdNames.push(rawName);
        }

        participants.push({
          wrestlerId: wrestler.id,
          team: parsed.teams[i],
          isWinner: parsed.winners[i],
        });
      }

      await prisma.match.create({
        data: {
          eventId: id,
          title: parsed.title,
          type: parsed.type,
          result: parsed.result || null,
          duration: parsed.duration || null,
          participants: { create: participants },
        },
      });
    }

    // Save the source URL back to the event
    await prisma.event.update({ where: { id }, data: { profightdbUrl: url } });

    // Return full match list with the expected stats shape
    const updatedMatches = await prisma.match.findMany({
      where: { eventId: id },
      include: {
        participants: {
          include: { wrestler: true },
          orderBy: { team: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({
      success: true,
      matchesImported: parsedMatches.length,
      wrestlersMatched,
      wrestlersCreated,
      createdNames,
      matches: updatedMatches,
    });
  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json(
      { error: `Import failed: ${err.message}` },
      { status: 500 },
    );
  }
}
