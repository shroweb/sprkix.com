import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../../lib/prisma";
import { getUserFromServerCookie } from "../../../../../../lib/server-auth";
import { parseCagematchHtml, parseProfightDbHtml, parseCagematchEventInfo } from "../../../../../../lib/cagematch";
import { uniqueWrestlerSlug } from "../../../../../../lib/slug-utils";

async function fetchWithFallback(url: string): Promise<string> {
  const headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };
  // Try direct fetch first
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
    if (res.ok) return await res.text();
  } catch { /* fall through */ }

  // Fallback: AllOrigins CORS proxy
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
  if (!proxyRes.ok) throw new Error("Could not fetch page — site may be blocking automated requests");
  const data = await proxyRes.json();
  if (!data.contents) throw new Error("Proxy returned empty content");
  return data.contents;
}

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
    const html = await fetchWithFallback(url);
    const isProfightDb = url.includes("profightdb.com");
    const parsedMatches = isProfightDb
      ? parseProfightDbHtml(html)
      : await parseCagematchHtml(html);

    if (parsedMatches.length === 0) {
      return NextResponse.json({ error: "No matches found on that page — check the URL is a valid event card" }, { status: 422 });
    }

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
            data: { name: rawName, slug: await uniqueWrestlerSlug(rawName) },
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

    // For Cagematch imports: pull attendance, venue, city, network from the event info box
    const eventUpdate: Record<string, any> = { profightdbUrl: url }
    if (!isProfightDb) {
      const eventInfo = parseCagematchEventInfo(html)
      if (eventInfo.attendance) eventUpdate.attendance = eventInfo.attendance
      if (eventInfo.network)    eventUpdate.network    = eventInfo.network
      if (eventInfo.city)       eventUpdate.city       = eventInfo.city
      if (eventInfo.venue)      eventUpdate.venue      = eventInfo.venue
    }
    await prisma.event.update({ where: { id }, data: eventUpdate });

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
