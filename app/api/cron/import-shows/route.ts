import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import {
  parseCagematchHtml,
  parseCagematchEventInfo,
  parseCagematchEventList,
  parseCagematchHomepage,
  parseCagematchDate,
} from "@lib/cagematch";
import { uniqueWrestlerSlug } from "@lib/slug-utils";
import { findEventOnTMDB } from "@lib/tmdb";
import { postNewEventToX } from "@lib/x-event-post";

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

type FetchHtmlResult = {
  html: string;
  source: "scraperapi" | "direct" | "allorigins" | "codetabs";
};

function detectBlockedHtml(html: string): string | null {
  const lower = html.toLowerCase();
  const blockMarkers: Array<[string, string]> = [
    ["x-sucuri-block", "Sucuri block page"],
    ["access denied", "Access denied page"],
    ["request unsuccessful", "Blocked request page"],
    ["captcha", "Captcha challenge page"],
    ["just a moment", "Browser challenge page"],
    ["cf-browser-verification", "Cloudflare challenge page"],
    ["please enable cookies", "Cookie challenge page"],
    ["please enable javascript", "JavaScript challenge page"],
  ];

  for (const [needle, label] of blockMarkers) {
    if (lower.includes(needle)) return label;
  }

  return null;
}

async function fetchHtml(url: string): Promise<FetchHtmlResult> {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
  };
  const failures: string[] = [];

  async function validateHtml(source: FetchHtmlResult["source"], html: string) {
    const blockedReason = detectBlockedHtml(html);
    if (blockedReason) {
      throw new Error(`${source} returned ${blockedReason}`);
    }
    if (html.trim().length < 500) {
      throw new Error(`${source} returned unexpectedly short HTML`);
    }
    return { html, source } as FetchHtmlResult;
  }

  // Try ScraperAPI first (handles anti-bot protection)
  const scraperKey = process.env.SCRAPER_API_KEY;
  if (scraperKey) {
    try {
      const r = await fetch(
        `https://api.scraperapi.com/?api_key=${scraperKey}&url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(30000) }
      );
      if (!r.ok) throw new Error(`status ${r.status}`);
      return await validateHtml("scraperapi", await r.text());
    } catch (err: any) {
      failures.push(`scraperapi: ${err.message}`);
    }
  }

  // Fallback: direct fetch
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(12000) });
    if (!res.ok) throw new Error(`status ${res.status}`);
    return await validateHtml("direct", await res.text());
  } catch (err: any) {
    failures.push(`direct: ${err.message}`);
  }

  // Last resort proxies
  const proxies: Array<{
    name: FetchHtmlResult["source"];
    run: () => Promise<string>;
  }> = [
    {
      name: "allorigins",
      run: async () => {
        const r = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error(`status ${r.status}`);
        const d = await r.json();
        if (!d.contents) throw new Error("empty response");
        return d.contents as string;
      },
    },
    {
      name: "codetabs",
      run: async () => {
        const r = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(15000) });
        if (!r.ok) throw new Error(`status ${r.status}`);
        return r.text();
      },
    },
  ];
  for (const proxy of proxies) {
    try {
      return await validateHtml(proxy.name, await proxy.run());
    } catch (err: any) {
      failures.push(`${proxy.name}: ${err.message}`);
    }
  }

  throw new Error(`All fetch sources failed for ${url}. ${failures.join(" | ")}`);
}

function describeEntrySource(entryCount: number, source: FetchHtmlResult["source"]) {
  return `${source}:${entryCount}`;
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

  // Fetch the Cagematch homepage — it groups events by date under .Caption
  // headings and includes newly-added shows that haven't been rated yet.
  // Fall back to the list view if the homepage doesn't have the target date.
  let entries: ReturnType<typeof parseCagematchEventList> = [];
  let listSource: string | null = null;
  try {
    const homepageFetch = await fetchHtml("https://www.cagematch.net/");
    entries = parseCagematchHomepage(homepageFetch.html, dateStr);
    listSource = describeEntrySource(entries.length, homepageFetch.source);

    // If homepage didn't have events for this date (it only covers recent days),
    // fall back to the top-rated list view
    if (entries.length === 0) {
      const listUrl = `https://www.cagematch.net/?id=1&view=list&dateFrom=${dateStr}&dateTo=${dateStr}`;
      const listFetch = await fetchHtml(listUrl);
      entries = parseCagematchEventList(listFetch.html);
      listSource = describeEntrySource(entries.length, listFetch.source);
    }
  } catch (err: any) {
    console.error("[cron] Failed to fetch Cagematch listing:", err.message);
    return NextResponse.json(
      { error: `Could not fetch Cagematch listing: ${err.message}` },
      { status: 500 }
    );
  }

  const results = {
    date: dateStr,
    totalFound: entries.length,
    promotionMatched: 0,
    alreadyExists: 0,
    created: 0,
    fetchSource: listSource,
    errors: [] as string[],
  };

  if (entries.length === 0) {
    const emptyError = `[cron] Parsed zero entries for ${dateStr}. Source: ${listSource ?? "unknown"}`;
    console.error(emptyError);
    return NextResponse.json(
      {
        ...results,
        error: emptyError,
      },
      { status: 500 }
    );
  }

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

    // Auto-create promotion record if it doesn't exist yet
    if (promoShort) {
      await prisma.promotion.upsert({
        where: { shortName: promoShort },
        update: {},
        create: { shortName: promoShort },
      });
    }

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
      const eventFetch = await fetchHtml(entry.cagematchUrl);
      const info = parseCagematchEventInfo(eventFetch.html);

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
      const matchCount = await importMatchesIntoEvent(event.id, eventFetch.html);

      // Try TMDB for poster (PPVs often have one; weekly TV usually won't)
      if (!event.posterUrl) {
        try {
          const tmdb = await findEventOnTMDB(normalised);
          if (tmdb?.posterUrl) {
            await prisma.event.update({
              where: { id: event.id },
              data: { posterUrl: tmdb.posterUrl },
            });
            event.posterUrl = tmdb.posterUrl;
          }
        } catch { /* TMDB failing shouldn't block the import */ }
      }

      try {
        await postNewEventToX({
          title: event.title,
          slug: event.slug,
          promotion: event.promotion,
          posterUrl: event.posterUrl,
        });
      } catch (postErr) {
        console.error(`[cron] Error posting "${normalised}" to IFTTT:`, postErr);
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
