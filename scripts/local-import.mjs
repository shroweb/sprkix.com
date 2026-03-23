/**
 * Local Cagematch importer — runs from your machine directly against Supabase.
 * Usage: node scripts/local-import.mjs 2026-02-23 2026-03-23
 */
import { execSync } from "child_process";
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
  "impact wrestling": "TNA",
  "pro wrestling noah": "NOAH",
  "stardom": "STARDOM",
};

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

const SCRAPER_KEY = env.SCRAPER_API_KEY || "1d5fbe4c46aa7c99e555d3f592e19de5";

async function fetchHtml(url) {
  const scraperUrl = `https://api.scraperapi.com/?api_key=${SCRAPER_KEY}&url=${encodeURIComponent(url)}`;
  const res = await fetch(scraperUrl, { signal: AbortSignal.timeout(30000) });
  if (!res.ok) throw new Error(`ScraperAPI HTTP ${res.status} for ${url}`);
  return res.text();
}

function parseListing(html) {
  const $ = load(html);
  const events = [];
  $("tr.TRow1, tr.TRow2").each((_, row) => {
    const $row = $(row);
    let eventHref = "", title = "";
    const links = $row.find("a");
    links.each((_, a) => {
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
        // Text or img alt/title
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

function parseDate(str) {
  const m = str.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  return new Date(`${m[3]}-${m[2]}-${m[1]}T12:00:00Z`);
}

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function uniqueSlug(base, model, field) {
  let slug = base, i = 2;
  while (await prisma[model].findUnique({ where: { [field]: slug } })) slug = `${base}-${i++}`;
  return slug;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function importDay(dateStr) {
  await sleep(8000); // be polite to Cagematch
  const url = `https://www.cagematch.net/?id=1&view=list&dateFrom=${dateStr}&dateTo=${dateStr}`;
  let html;
  try { html = await fetchHtml(url); } catch (e) { console.log(`  ✗ fetch failed: ${e.message}`); return; }

  const entries = parseListing(html);
  let created = 0;

  for (const entry of entries) {
    const promoLower = entry.promotion.toLowerCase();
    const promoShort = PROMOTION_MAP[promoLower] ??
      Object.entries(PROMOTION_MAP).find(([k]) => promoLower.includes(k))?.[1];
    if (!promoShort) continue;

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
      let eventHtml = await fetchHtml(entry.url);
      const slug = await uniqueSlug(slugify(entry.title), "event", "slug");
      const event = await prisma.event.create({
        data: { title: entry.title, slug, date: eventDate, promotion: promoShort, profightdbUrl: entry.url },
      });
      created++;
      process.stdout.write(".");
    } catch (e) {
      process.stdout.write("x");
    }
  }
  return created;
}

// Parse date range from args
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
