import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import {
  parseCagematchDate,
  parseCagematchEventInfo,
  parseCagematchHtml,
} from "@lib/cagematch";
import { uniqueEventSlug, uniqueWrestlerSlug } from "@lib/slug-utils";
import { findEventOnTMDB } from "@lib/tmdb";
import { postNewEventToX } from "@lib/x-event-post";

export const runtime = "nodejs";
export const maxDuration = 300;

const CRON_SECRET = process.env.CRON_SECRET;

const PROMOTION_MAP: Record<string, string> = {
  "all elite wrestling": "AEW",
  "world wrestling entertainment": "WWE",
  "wwe": "WWE",
  "total nonstop action wrestling": "TNA",
  "tna wrestling": "TNA",
  "ring of honor": "ROH",
  "new japan pro-wrestling": "NJPW",
  "new japan pro wrestling": "NJPW",
  "all japan pro wrestling": "AJPW",
  "stardom": "STARDOM",
  "impact wrestling": "TNA",
  "pro wrestling noah": "NOAH",
};

type BrowserImportedEvent = {
  title: string;
  date: string;
  promotion: string;
  cagematchUrl: string;
  eventHtml: string;
};

function getBearerSecret(req: NextRequest): string | null {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

function resolvePromotion(rawPromotion: string, title: string): string {
  const promotionLower = rawPromotion.toLowerCase().trim();
  const direct =
    PROMOTION_MAP[promotionLower] ??
    Object.entries(PROMOTION_MAP).find(([key]) => promotionLower.includes(key))?.[1];
  if (direct) return direct;

  const titleLower = title.toLowerCase();
  const fromTitle = Object.entries(PROMOTION_MAP).find(([key, short]) => {
    return titleLower.startsWith(`${short.toLowerCase()} `) || titleLower.includes(key);
  })?.[1];

  return fromTitle ?? rawPromotion;
}

async function importMatchesIntoEvent(eventId: string, html: string) {
  const parsedMatches = await parseCagematchHtml(html);
  if (parsedMatches.length === 0) return 0;

  const existingWrestlers = await prisma.wrestler.findMany();
  const wrestlerByName = new Map(
    existingWrestlers.map((w) => [w.name.toLowerCase(), w])
  );

  for (const parsed of parsedMatches) {
    const participants = [];
    for (let i = 0; i < parsed.wrestlers.length; i++) {
      const rawName = parsed.wrestlers[i];
      const key = rawName.toLowerCase();
      let wrestler = wrestlerByName.get(key);

      if (!wrestler) {
        for (const [knownKey, knownWrestler] of wrestlerByName) {
          if (knownKey.includes(key) || key.includes(knownKey)) {
            wrestler = knownWrestler;
            break;
          }
        }
      }

      if (!wrestler) {
        wrestler = await prisma.wrestler.create({
          data: { name: rawName, slug: await uniqueWrestlerSlug(rawName) },
        });
        wrestlerByName.set(key, wrestler);
      }

      participants.push({
        wrestlerId: wrestler.id,
        team: parsed.teams[i],
        isWinner: parsed.winners[i],
      });
    }

    await prisma.match.create({
      data: {
        eventId,
        title: parsed.title,
        type: parsed.type,
        result: parsed.result || null,
        duration: parsed.duration || null,
        participants: { create: participants },
      },
    });
  }

  return parsedMatches.length;
}

export async function POST(req: NextRequest) {
  if (!CRON_SECRET) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 503 });
  }

  if (getBearerSecret(req) !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const date = typeof body?.date === "string" ? body.date : null;
  const events = Array.isArray(body?.events) ? (body.events as BrowserImportedEvent[]) : [];

  if (!date) {
    return NextResponse.json({ error: "date is required" }, { status: 400 });
  }

  if (events.length === 0) {
    return NextResponse.json({ error: "events array is required" }, { status: 400 });
  }

  const configRow = await prisma.siteConfig.findUnique({
    where: { key: "AUTO_IMPORT_PROMOTIONS" },
  });
  const configuredNames: string[] = configRow?.value
    ? configRow.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : Object.keys(PROMOTION_MAP);

  const results = {
    date,
    totalFound: events.length,
    promotionMatched: 0,
    alreadyExists: 0,
    created: 0,
    importedMatches: 0,
    errors: [] as string[],
  };

  for (const entry of events) {
    const title = entry.title?.trim();
    const dateValue = entry.date?.trim();
    const promotionValue = entry.promotion?.trim();
    const cagematchUrl = entry.cagematchUrl?.trim();
    const eventHtml = entry.eventHtml;

    if (!title || !dateValue || !promotionValue || !cagematchUrl || !eventHtml) {
      results.errors.push(`Skipped malformed entry: ${title || cagematchUrl || "unknown"}`);
      continue;
    }

    const promotionLower = promotionValue.toLowerCase();
    const isConfigured = configuredNames.some(
      (configured) =>
        promotionLower === configured || promotionLower.includes(configured)
    );
    if (!isConfigured) continue;

    results.promotionMatched++;

    const eventDate = parseCagematchDate(dateValue);
    if (!eventDate) {
      results.errors.push(`Could not parse event date for ${title}`);
      continue;
    }

    const existing = await prisma.event.findFirst({
      where: {
        OR: [
          { profightdbUrl: cagematchUrl },
          {
            title: { equals: title, mode: "insensitive" },
            date: {
              gte: new Date(eventDate.getTime() - 12 * 3600_000),
              lte: new Date(eventDate.getTime() + 36 * 3600_000),
            },
          },
        ],
      },
    });

    if (existing) {
      results.alreadyExists++;
      continue;
    }

    try {
      const info = parseCagematchEventInfo(eventHtml);
      const promotion = resolvePromotion(promotionValue, title);

      if (promotion) {
        await prisma.promotion.upsert({
          where: { shortName: promotion },
          update: {},
          create: { shortName: promotion },
        });
      }

      const slug = await uniqueEventSlug(title);
      const event = await prisma.event.create({
        data: {
          title,
          slug,
          date: eventDate,
          promotion,
          venue: info.venue ?? null,
          city: info.city ?? null,
          attendance: info.attendance ?? null,
          network: info.network ?? null,
          profightdbUrl: cagematchUrl,
        },
      });

      const matchCount = await importMatchesIntoEvent(event.id, eventHtml);
      results.importedMatches += matchCount;

      if (!event.posterUrl) {
        try {
          const tmdb = await findEventOnTMDB(title);
          if (tmdb?.posterUrl) {
            await prisma.event.update({
              where: { id: event.id },
              data: { posterUrl: tmdb.posterUrl },
            });
            event.posterUrl = tmdb.posterUrl;
          }
        } catch {
          // Non-fatal.
        }
      }

      try {
        await postNewEventToX({
          title: event.title,
          slug: event.slug,
          promotion: event.promotion,
          posterUrl: event.posterUrl,
        });
      } catch (postErr) {
        console.error(`[browser-import] Error posting "${title}" to IFTTT:`, postErr);
      }

      results.created++;
    } catch (err: any) {
      console.error(`[browser-import] Error importing "${title}":`, err);
      results.errors.push(`${title}: ${err?.message || "Unknown error"}`);
    }
  }

  return NextResponse.json(results);
}
