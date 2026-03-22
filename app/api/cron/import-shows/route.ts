import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import {
  parseCagematchHtml,
  parseCagematchEventInfo,
  parseCagematchEventList,
  parseCagematchDate,
} from "@lib/cagematch";
import { uniqueWrestlerSlug } from "@lib/slug-utils";
import { findEventOnTMDB } from "@lib/tmdb";

export const runtime = "nodejs";
export const maxDuration = 300; // 5 min — importing can be slow

// ─── Promotions to auto-import ────────────────────────────────────────────
// Cagematch uses full promotion names in their listings.
// These strings are matched case-insensitively against the scraped promotion column.
// The "slug prefix" is the shorthand stored in the Event.promotion field.
const PROMOTION_MAP: Record<string, string> = {
  "all elite wrestling": "AEW",
  "world wrestling entertainment": "WWE",
  "wwe": "WWE",
  "total nonstop action wrestling": "TNA",
  "tna wrestling": "TNA",
  "ring of honor": "ROH",
  "new japan pro-wrestling": "NJPW",
  "all japan pro wrestling": "AJPW",
  "stardom": "STARDOM",
  "impact wrestling": "TNA",
  "pro wrestling noah": "NOAH",
};

// ─── Helpers ──────────────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };

  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if (res.ok) return res.text();
  } catch { /* fall through to proxy */ }

  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl, { signal: AbortSignal.timeout(18000) });
  if (!proxyRes.ok) throw new Error(`Proxy failed for ${url}`);
  const data = await proxyRes.json();
  if (!data.contents) throw new Error(`Proxy empty content for ${url}`);
  return data.contents;
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueEventSlug(base: string): Promise<string> {
  let slug = base;
  let counter = 2;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
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
        for (const [k, w] of wrestlerByName) {
          if (k.includes(key) || key.includes(k)) {
            wrestler = w;
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

// ─── Cron handler ─────────────────────────────────────────────────────────

export async function GET(req: Request) {
  // Verify Vercel cron secret
  const authHeader = req.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // Allow override: ?date=2026-03-22 — defaults to yesterday
  let targetDate: Date;
  const dateParam = searchParams.get("date");
  if (dateParam) {
    targetDate = new Date(dateParam);
  } else {
    targetDate = new Date();
    targetDate.setUTCDate(targetDate.getUTCDate() - 1);
  }

  const yyyy = targetDate.getUTCFullYear();
  const mm   = String(targetDate.getUTCMonth() + 1).padStart(2, "0");
  const dd   = String(targetDate.getUTCDate()).padStart(2, "0");
  const dateStr = `${yyyy}-${mm}-${dd}`;

  // Read configurable promotion list from SiteConfig (key: AUTO_IMPORT_PROMOTIONS)
  // Value is a comma-separated list of Cagematch promotion names to include,
  // e.g. "All Elite Wrestling,WWE,TNA Wrestling,Ring of Honor"
  // If not set, defaults to the built-in PROMOTION_MAP keys
  const configRow = await prisma.siteConfig.findUnique({
    where: { key: "AUTO_IMPORT_PROMOTIONS" },
  });
  const configuredNames: string[] = configRow?.value
    ? configRow.value.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
    : Object.keys(PROMOTION_MAP);

  // Fetch the Cagematch events listing for the target date
  const listUrl = `https://www.cagematch.net/?id=1&view=list&dateFrom=${dateStr}&dateTo=${dateStr}`;
  let listHtml: string;
  try {
    listHtml = await fetchHtml(listUrl);
  } catch (err: any) {
    console.error("[cron] Failed to fetch Cagematch event list:", err.message);
    return NextResponse.json(
      { error: `Could not fetch Cagematch listing: ${err.message}` },
      { status: 500 }
    );
  }

  const entries = parseCagematchEventList(listHtml);

  const results = {
    date: dateStr,
    totalFound: entries.length,
    promotionMatched: 0,
    alreadyExists: 0,
    created: 0,
    errors: [] as string[],
  };

  for (const entry of entries) {
    const promoLower = entry.promotion.toLowerCase();
    const promoShort =
      PROMOTION_MAP[promoLower] ??
      Object.entries(PROMOTION_MAP).find(([k]) => promoLower.includes(k))?.[1];

    // Skip if not in configured import list
    const isConfigured = configuredNames.some(
      (n) => promoLower === n || promoLower.includes(n)
    );
    if (!isConfigured) continue;
    results.promotionMatched++;

    // Check if we already have an event with this title on this date
    const eventDate = parseCagematchDate(entry.date);
    if (!eventDate) continue;

    const normalised = entry.title.trim();
    const existing = await prisma.event.findFirst({
      where: {
        title: { equals: normalised, mode: "insensitive" },
        date: {
          gte: new Date(eventDate.getTime() - 12 * 3600_000),
          lte: new Date(eventDate.getTime() + 36 * 3600_000),
        },
      },
    });

    if (existing) {
      results.alreadyExists++;
      continue;
    }

    try {
      // Fetch the individual event page to get full details
      const eventHtml = await fetchHtml(entry.cagematchUrl);
      const info = parseCagematchEventInfo(eventHtml);

      const slug = await uniqueEventSlug(slugifyTitle(normalised));
      const promotion = promoShort ?? entry.promotion;

      const event = await prisma.event.create({
        data: {
          title: normalised,
          slug,
          date: eventDate,
          promotion,
          venue:      info.venue      ?? null,
          city:       info.city       ?? null,
          attendance: info.attendance ?? null,
          network:    info.network    ?? null,
          profightdbUrl: entry.cagematchUrl,
        },
      });

      // Import match card
      const matchCount = await importMatchesIntoEvent(event.id, eventHtml);

      // Try TMDB for poster (PPVs often have one; weekly TV usually won't)
      if (!event.posterUrl) {
        try {
          const tmdb = await findEventOnTMDB(normalised);
          if (tmdb?.posterUrl) {
            await prisma.event.update({
              where: { id: event.id },
              data: { posterUrl: tmdb.posterUrl },
            });
          }
        } catch { /* TMDB failing shouldn't block the import */ }
      }

      console.log(`[cron] Created ${normalised} (${matchCount} matches)`);
      results.created++;
    } catch (err: any) {
      console.error(`[cron] Error importing "${normalised}":`, err.message);
      results.errors.push(`${normalised}: ${err.message}`);
    }
  }

  return NextResponse.json(results);
}
