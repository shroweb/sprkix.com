/**
 * Local Cagematch importer — runs from your machine directly against Supabase.
 * Imports events + full match cards including wrestler creation.
 * Usage: node scripts/local-import.mjs 2026-02-23 2026-03-23
 */
import { readFileSync } from "fs";
import { load } from "cheerio";

// Load .env manually
const envFile = readFileSync(".env", "utf-8");
const env = {};
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}
process.env.DATABASE_URL = env.DATABASE_URL;
process.env.DIRECT_URL   = env.DIRECT_URL;

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();

const PROMOTION_MAP = {
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

const SCRAPER_KEY = env.SCRAPER_API_KEY || "1d5fbe4c46aa7c99e555d3f592e19de5";
const TMDB_KEY = env.TMDB_API_KEY;

async function fetchHtml(url) {
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}`;
  const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(60000) });
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status} for ${url}`);
  return res.text();
}

// ── Homepage parser (groups events by .Caption date sections) ─────────────────

const MONTH_MAP = { january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11 };
const ALL_TROW = 'tr.TRow1, tr.TRow2, tr.TRowTVShow, tr.TRowPremiumLiveEvent, tr.TRowOnlineStream, tr.TRowPayPayView';

function parseCaptionDate(text) {
  const m = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!m) return null;
  const month = MONTH_MAP[m[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(parseInt(m[3]), month, parseInt(m[1])));
}

function parseHomepage(html, targetDateISO) {
  const $ = load(html);
  const events = [];
  $('.Caption').each((_, captionEl) => {
    const dateObj = parseCaptionDate($(captionEl).text().trim());
    if (!dateObj) return;
    const iso = dateObj.toISOString().slice(0, 10);
    if (targetDateISO && iso !== targetDateISO) return;
    const dd   = String(dateObj.getUTCDate()).padStart(2, '0');
    const mm   = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getUTCFullYear();
    const dateDDMMYYYY = `${dd}.${mm}.${yyyy}`;
    $(captionEl).nextAll('.Table').first().find(ALL_TROW).each((_, row) => {
      const $row = $(row);
      const link = $row.find('a[href*="id=1&nr="]').first();
      const title = link.text().trim();
      const href = link.attr('href') || '';
      if (!title || !href) return;
      const url = href.startsWith('http') ? href : `https://www.cagematch.net/${href}`;
      const promoLink = $row.find('a[href*="id=8"]').first();
      const promotion = promoLink.text().trim() || promoLink.find('img').attr('alt') || '';
      events.push({ date: dateDDMMYYYY, promotion, title, url });
    });
  });
  return events;
}

// ── Listing parser (fallback — top-rated events only) ─────────────────────────

function parseListing(html) {
  const $ = load(html);
  const events = [];
  $("tr.TRow1, tr.TRow2").each((_, row) => {
    const $row = $(row);
    let eventHref = "", title = "";
    $row.find("a").each((_, a) => {
      const h = $(a).attr("href") || "";
      if (h.includes("id=1") && h.includes("nr=") && !h.includes("page=")) {
        eventHref = h;
        title = $(a).text().trim();
      }
    });
    if (!title || !eventHref) return;

    const cells = $row.find("td");
    let dateMatch = null;
    for (let ci = 0; ci < Math.min(cells.length, 4); ci++) {
      dateMatch = $(cells[ci]).text().trim().match(/\d{2}\.\d{2}\.\d{4}/);
      if (dateMatch) break;
    }
    if (!dateMatch) return;

    let promotion = "";
    $row.find("a").each((_, a) => {
      const h = $(a).attr("href") || "";
      if (h.includes("id=8") && !promotion) {
        promotion = $(a).text().trim() ||
          $(a).find("img").attr("alt") ||
          $(a).find("img").attr("title") || "";
      }
    });

    const url = eventHref.startsWith("http")
      ? eventHref
      : `https://www.cagematch.net/${eventHref}`;
    events.push({ date: dateMatch[0], promotion, title, url });
  });
  return events;
}

// ── Event info parser ─────────────────────────────────────────────────────────

function parseEventInfo(html) {
  const $ = load(html);
  const info = {};
  $(".InformationBoxTable .InformationBoxRow").each((_, row) => {
    const tds = $(row).find("td");
    if (tds.length >= 2) {
      const label = $(tds[0]).text().trim().toLowerCase().replace(/:$/, "").trim();
      const value = $(tds[1]).text().trim();
      if (label && value) info[label] = value;
    }
  });
  const attendanceRaw = info["attendance"] || "";
  const attendanceNum = attendanceRaw ? parseInt(attendanceRaw.replace(/[.,\s]/g, "")) : NaN;
  const locationRaw = info["location"] || "";
  const city = locationRaw ? locationRaw.split(",")[0].trim() : undefined;
  return {
    attendance: !isNaN(attendanceNum) && attendanceNum > 0 ? attendanceNum : undefined,
    network: info["tv station/network"] || info["tv station / network"] || info["network"] || undefined,
    city: city || undefined,
    venue: info["arena"] || info["venue"] || undefined,
  };
}

// ── Match parser ──────────────────────────────────────────────────────────────

function isWrestlerHref(href) {
  return /[?&]id=2[^0-9]/.test(href) || href.endsWith("id=2");
}

function parseDuration(text) {
  const m = text.match(/(\d+):(\d+)/);
  if (m) return parseInt(m[1]) * 60 + parseInt(m[2]);
  const min = text.match(/(\d+)\s*min/i);
  if (min) return parseInt(min[1]) * 60;
  return undefined;
}

function parseMatches(html) {
  const $ = load(html);
  const matches = [];
  $(".Match").each((_, el) => {
    const $el = $(el);
    const rawMatchText = $el.find(".MatchResults").text().trim() || $el.text().trim();
    let rawHtml = $el.html() || "";
    rawHtml = rawHtml.replace(/\(w\/.*?\)/gi, "");
    const $c = load(rawHtml);

    const wrestlers = [], teams = [], winners = [];
    const isFFA = /triple threat|three way|four way|five way|six way|chamber|rumble|battle royal|scramble|survival/i.test(rawMatchText);
    const lowerText = rawMatchText.toLowerCase();
    const defeatKeyword =
      lowerText.includes(" defeats ") ? " defeats "
      : lowerText.includes(" defeat ") ? " defeat "
      : lowerText.includes(" def. ") ? " def. "
      : null;
    const defeatIndex = defeatKeyword !== null ? lowerText.indexOf(defeatKeyword) : -1;

    $c("a").each((_, a) => {
      const href = $c(a).attr("href") || "";
      if (!isWrestlerHref(href)) return;
      const name = $c(a).text().trim();
      if (!name || wrestlers.includes(name)) return;
      wrestlers.push(name);
      const nameIndex = lowerText.indexOf(name.toLowerCase());
      let isWinner = false, teamId = 1;
      if (isFFA) {
        teamId = wrestlers.length;
        isWinner = defeatIndex !== -1 && nameIndex !== -1 && nameIndex < defeatIndex;
      } else {
        if (defeatIndex !== -1 && nameIndex !== -1 && nameIndex > defeatIndex) {
          teamId = 2; isWinner = false;
        } else {
          teamId = 1; isWinner = defeatIndex !== -1;
        }
      }
      teams.push(teamId);
      winners.push(isWinner);
    });

    if (wrestlers.length < 2) return;

    const typeEl = $el.find(".MatchType, [class*='Type'], .matchtype").first();
    let matchType = typeEl.text().trim();
    if (!matchType || matchType === rawMatchText) {
      const g = rawMatchText.match(/^(.*?):/i);
      matchType = g ? g[1].trim() : (isFFA ? "Free-For-All Match" : "Singles Match");
    }

    const timeEl = $el.find(".MatchTime, .Time, .time").first();
    let durationText = timeEl.text().trim();
    if (!durationText) {
      const p = rawMatchText.match(/\((\d{1,3}:\d{2})\)$/);
      if (p) durationText = p[1];
    }

    matches.push({
      wrestlers, teams, winners,
      type: matchType,
      title: matchType,
      duration: durationText ? parseDuration(durationText) : undefined,
      result: rawMatchText.replace(/\(\d+:\d+\)/, "").trim(),
    });
  });
  return matches;
}

// ── Promotion auto-create ─────────────────────────────────────────────────────

const promotionCache = new Map();

async function ensurePromotion(shortName) {
  if (promotionCache.has(shortName)) return;
  const existing = await prisma.promotion.findUnique({ where: { shortName } });
  if (!existing) {
    await prisma.promotion.create({ data: { shortName } });
    console.log(`\n  + Created promotion: ${shortName}`);
  }
  promotionCache.set(shortName, true);
}

// ── TMDB poster lookup ────────────────────────────────────────────────────────

async function fetchTmdbPoster(title) {
  if (!TMDB_KEY) return null;
  const queries = new Set();
  const withoutEpisode = title.replace(/\s*#\d+\s*/g, ' ').replace(/[–—]\s*\d{4}\s*$/g, '').replace(/\s+/g, ' ').trim();
  if (withoutEpisode) queries.add(withoutEpisode);
  const baseName = title.replace(/\s*#\d+.*$/g, '').replace(/\s*[-–—].*$/g, '').trim();
  if (baseName && baseName !== withoutEpisode) queries.add(baseName);

  for (const q of queries) {
    const enc = encodeURIComponent(q);
    try {
      const [mr, tvr] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/search/movie?query=${enc}&api_key=${TMDB_KEY}`),
        fetch(`https://api.themoviedb.org/3/search/tv?query=${enc}&api_key=${TMDB_KEY}`),
      ]);
      if (!mr.ok || !tvr.ok) continue;
      const results = [
        ...(await mr.json()).results || [],
        ...(await tvr.json()).results || [],
      ];
      if (results.length > 0) {
        const best = results.sort((a, b) => b.popularity - a.popularity)[0];
        return best.poster_path ? `https://image.tmdb.org/t/p/w780${best.poster_path}` : null;
      }
    } catch { /* skip TMDB errors */ }
  }
  return null;
}

// ── Wrestler upsert cache ─────────────────────────────────────────────────────

let wrestlerCache = null;

async function getWrestlerByName(name) {
  if (!wrestlerCache) {
    const all = await prisma.wrestler.findMany({ select: { id: true, name: true, slug: true } });
    wrestlerCache = new Map(all.map(w => [w.name.toLowerCase(), w]));
  }
  const key = name.toLowerCase();
  if (wrestlerCache.has(key)) return wrestlerCache.get(key);
  // Partial match
  for (const [k, w] of wrestlerCache) {
    if (k.includes(key) || key.includes(k)) return w;
  }
  // Create new
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  let i = 2;
  while (await prisma.wrestler.findUnique({ where: { slug } })) slug = `${slug}-${i++}`;
  const w = await prisma.wrestler.create({ data: { name, slug } });
  wrestlerCache.set(key, w);
  return w;
}

async function importMatches(eventId, html) {
  const parsed = parseMatches(html);
  for (const m of parsed) {
    const participants = [];
    for (let i = 0; i < m.wrestlers.length; i++) {
      const wrestler = await getWrestlerByName(m.wrestlers[i]);
      participants.push({ wrestlerId: wrestler.id, team: m.teams[i], isWinner: m.winners[i] });
    }
    await prisma.match.create({
      data: {
        eventId,
        title: m.title,
        type: m.type,
        result: m.result || null,
        duration: m.duration || null,
        participants: { create: participants },
      },
    });
  }
  return parsed.length;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDate(str) {
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueEventSlug(base) {
  let slug = base, i = 2;
  while (await prisma.event.findUnique({ where: { slug } })) slug = `${base}-${i++}`;
  return slug;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ── Main import loop ──────────────────────────────────────────────────────────

async function importDay(dateStr) {
  await sleep(8000);

  // Try homepage first (groups by date, includes new shows before they're rated)
  let entries = [];
  try {
    const homepageHtml = await fetchHtml('https://www.cagematch.net/');
    entries = parseHomepage(homepageHtml, dateStr);
  } catch (e) { /* fall through */ }

  // Fall back to list view (top-rated only) if homepage didn't have this date
  if (entries.length === 0) {
    const url = `https://www.cagematch.net/?id=1&view=list&dateFrom=${dateStr}&dateTo=${dateStr}`;
    try {
      const html = await fetchHtml(url);
      entries = parseListing(html);
    } catch (e) { console.log(`  ✗ listing fetch failed: ${e.message}`); return 0; }
  }
  let created = 0;

  for (const entry of entries) {
    const promoLower = entry.promotion.toLowerCase();
    const promoShort = PROMOTION_MAP[promoLower] ??
      Object.entries(PROMOTION_MAP).find(([k]) => promoLower.includes(k))?.[1];
    if (!promoShort) continue;
    await ensurePromotion(promoShort);

    const eventDate = parseDate(entry.date);
    if (!eventDate) continue;

    const existing = await prisma.event.findFirst({
      where: {
        title: { equals: entry.title, mode: "insensitive" },
        date: { gte: new Date(eventDate - 43200000), lte: new Date(+eventDate + 129600000) },
      },
    });
    if (existing) { process.stdout.write("s"); continue; }

    try {
      const eventHtml = await fetchHtml(entry.url);
      const info = parseEventInfo(eventHtml);
      const slug = await uniqueEventSlug(slugify(entry.title));

      const event = await prisma.event.create({
        data: {
          title: entry.title, slug, date: eventDate, promotion: promoShort,
          profightdbUrl: entry.url,
          venue: info.venue ?? null,
          city: info.city ?? null,
          attendance: info.attendance ?? null,
          network: info.network ?? null,
        },
      });

      const matchCount = await importMatches(event.id, eventHtml);

      // TMDB poster
      try {
        const posterUrl = await fetchTmdbPoster(entry.title);
        if (posterUrl) await prisma.event.update({ where: { id: event.id }, data: { posterUrl } });
      } catch { /* non-fatal */ }

      created++;
      process.stdout.write(matchCount > 0 ? "." : "e");
    } catch (e) {
      process.stdout.write("x");
      console.error(`\n  ✗ ${entry.title}: ${e.message}`);
    }
  }
  return created;
}

const [fromArg, toArg] = process.argv.slice(2);
const from = new Date(fromArg || "2026-02-23");
const to   = new Date(toArg   || "2026-03-23");

let total = 0;
const cur = new Date(from);
while (cur <= to) {
  const dateStr = cur.toISOString().slice(0, 10);
  process.stdout.write(`${dateStr} `);
  const n = await importDay(dateStr);
  total += n || 0;
  console.log();
  cur.setDate(cur.getDate() + 1);
}

console.log(`\nDone. Created ${total} events.`);
await prisma.$disconnect();
