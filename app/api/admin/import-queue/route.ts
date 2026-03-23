import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { parseCagematchEventInfo, parseCagematchHtml } from "@lib/cagematch";
import { findEventOnTMDB } from "@lib/tmdb";
import { uniqueEventSlug } from "@lib/slug-utils";
import { uniqueWrestlerSlug } from "@lib/slug-utils";

export const runtime = "nodejs";
export const maxDuration = 60;

// ── ScraperAPI-aware fetch ────────────────────────────────────────────────────

async function fetchHtml(url: string): Promise<string> {
  const scraperKey = process.env.SCRAPER_API_KEY;
  if (scraperKey) {
    try {
      const r = await fetch(
        `https://api.scraperapi.com/?api_key=${scraperKey}&url=${encodeURIComponent(url)}`,
        { signal: AbortSignal.timeout(45000) }
      );
      if (r.ok) return r.text();
    } catch { /* fall through */ }
  }
  // Direct fallback
  const r = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Fetch failed: HTTP ${r.status}`);
  return r.text();
}

// ── Promotion short-name resolver ─────────────────────────────────────────────

const PROMOTION_MAP: Record<string, string> = {
  "all elite wrestling": "AEW",
  "world wrestling entertainment": "WWE",
  "wwe": "WWE",
  "total nonstop action wrestling": "TNA",
  "tna wrestling": "TNA",
  "ring of honor": "ROH",
  "new japan pro-wrestling": "NJPW",
  "new japan pro wrestling": "NJPW",
  "impact wrestling": "TNA",
  "pro wrestling noah": "NOAH",
  "stardom": "STARDOM",
};

function resolvePromotion(raw: string, titleFallback = ""): string {
  const lower = raw.toLowerCase();
  const mapped = PROMOTION_MAP[lower] ?? Object.entries(PROMOTION_MAP).find(([k]) => lower.includes(k))?.[1];
  if (mapped) return mapped;
  // Try extracting from event title (e.g. "AEW Collision #136" → "AEW")
  const titleLower = titleFallback.toLowerCase();
  const fromTitle = Object.entries(PROMOTION_MAP).find(([k]) => titleLower.startsWith(k) || titleLower.includes(k))?.[1];
  if (fromTitle) return fromTitle;
  // Check if title starts with a known short name directly
  for (const short of Object.values(PROMOTION_MAP)) {
    if (titleFallback.toUpperCase().startsWith(short + " ")) return short;
  }
  return raw || "Unknown";
}

// ── Match import ──────────────────────────────────────────────────────────────

async function importMatches(eventId: string, html: string): Promise<number> {
  const parsedMatches = await parseCagematchHtml(html);
  if (parsedMatches.length === 0) return 0;

  const existingWrestlers = await prisma.wrestler.findMany();
  const wrestlerByName = new Map(existingWrestlers.map((w) => [w.name.toLowerCase(), w]));

  for (const parsed of parsedMatches) {
    const participants = [];
    for (let i = 0; i < parsed.wrestlers.length; i++) {
      const rawName = parsed.wrestlers[i];
      const key = rawName.toLowerCase();
      let wrestler = wrestlerByName.get(key);
      if (!wrestler) {
        for (const [k, w] of wrestlerByName) {
          if (k.includes(key) || key.includes(k)) { wrestler = w; break; }
        }
      }
      if (!wrestler) {
        wrestler = await prisma.wrestler.create({
          data: { name: rawName, slug: await uniqueWrestlerSlug(rawName) },
        });
        wrestlerByName.set(key, wrestler);
      }
      participants.push({ wrestlerId: wrestler.id, team: parsed.teams[i], isWinner: parsed.winners[i] });
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

// ── POST /api/admin/import-queue ──────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await req.json();
  if (!url?.trim()) return NextResponse.json({ error: "URL required" }, { status: 400 });

  const absoluteUrl = url.startsWith("http") ? url : `https://www.cagematch.net${url}`;

  try {
    // Fetch event page via ScraperAPI
    const html = await fetchHtml(absoluteUrl);

    // Parse event metadata
    const info = parseCagematchEventInfo(html);
    const title = info.title || absoluteUrl;
    const promotionShort = resolvePromotion(info.promotion || "", title);

    // Auto-create promotion if needed
    if (promotionShort && promotionShort !== "Unknown") {
      await prisma.promotion.upsert({
        where: { shortName: promotionShort },
        update: {},
        create: { shortName: promotionShort },
      });
    }

    // Check if event already exists
    let event = await prisma.event.findFirst({ where: { profightdbUrl: absoluteUrl } });

    if (!event) {
      const slug = await uniqueEventSlug(title);

      // Parse date from info (DD.MM.YYYY → Date)
      let date = new Date();
      if (info.date) {
        const m = info.date.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        if (m) date = new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`);
      }

      // Attendance
      const attendanceRaw = (info as any).attendance || "";
      const attendance = attendanceRaw ? parseInt(String(attendanceRaw).replace(/[.,\s]/g, "")) : null;

      event = await prisma.event.create({
        data: {
          title,
          slug,
          date,
          promotion: promotionShort,
          profightdbUrl: absoluteUrl,
          venue: info.venue ?? null,
          city: info.city ?? null,
          attendance: attendance && !isNaN(attendance) ? attendance : null,
          network: info.network ?? null,
        },
      });
    }

    // Import matches + wrestlers
    const wrestlerCountBefore = await prisma.wrestler.count();
    const matchCountBefore = await prisma.match.count({ where: { eventId: event.id } });
    const matchCount = await importMatches(event.id, html);
    const wrestlerCountAfter = await prisma.wrestler.count();
    const matchCountAfter = await prisma.match.count({ where: { eventId: event.id } });

    // TMDB poster
    if (!event.posterUrl) {
      try {
        const tmdb = await findEventOnTMDB(event.title);
        if (tmdb?.posterUrl) {
          await prisma.event.update({ where: { id: event.id }, data: { posterUrl: tmdb.posterUrl } });
        }
      } catch { /* non-fatal */ }
    }

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
