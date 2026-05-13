import { chromium } from "playwright";
import * as cheerio from "cheerio";

function getTargetDate() {
  const explicit = process.env.IMPORT_DATE?.trim();
  if (explicit) return explicit;

  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().slice(0, 10);
}

function parseCaptionDate(text) {
  const months = {
    january: 0,
    february: 1,
    march: 2,
    april: 3,
    may: 4,
    june: 5,
    july: 6,
    august: 7,
    september: 8,
    october: 9,
    november: 10,
    december: 11,
  };
  const match = text.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
  if (!match) return null;
  const month = months[match[2].toLowerCase()];
  if (month === undefined) return null;
  return new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
}

function extractRowEvent($, row, dateDDMMYYYY) {
  const $row = $(row);
  const eventLink = $row.find('a[href*="id=1&nr="]').first();
  if (!eventLink.length) return null;

  const title = eventLink.text().trim();
  const href = eventLink.attr("href") || "";
  if (!title || !href) return null;

  const cagematchUrl = href.startsWith("http")
    ? href
    : `https://www.cagematch.net/${href}`;

  const promotionLink = $row
    .find("a")
    .filter((_, a) => (($(a).attr("href") || "").includes("id=8")))
    .first();
  const promotion =
    promotionLink.text().trim() ||
    promotionLink.find("img").attr("alt") ||
    promotionLink.find("img").attr("title") ||
    "";

  return { title, date: dateDDMMYYYY, promotion, cagematchUrl };
}

const ALL_ROWS = "tr.TRow1, tr.TRow2, tr.TRowTVShow, tr.TRowPremiumLiveEvent, tr.TRowOnlineStream, tr.TRowPayPayView";

function parseHomepage(html, targetDateIso) {
  const $ = cheerio.load(html);
  const events = [];

  $(".Caption").each((_, captionEl) => {
    const dateObj = parseCaptionDate($(captionEl).text().trim());
    if (!dateObj) return;

    const iso = dateObj.toISOString().slice(0, 10);
    if (iso !== targetDateIso) return;

    const dd = String(dateObj.getUTCDate()).padStart(2, "0");
    const mm = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = dateObj.getUTCFullYear();
    const dateDDMMYYYY = `${dd}.${mm}.${yyyy}`;

    $(captionEl)
      .nextAll(".Table")
      .first()
      .find(ALL_ROWS)
      .each((_, row) => {
        const entry = extractRowEvent($, row, dateDDMMYYYY);
        if (entry) events.push(entry);
      });
  });

  return events;
}

function parseEventList(html) {
  const $ = cheerio.load(html);
  const events = [];

  $(ALL_ROWS).each((_, row) => {
    const $row = $(row);
    const eventLink = $row.find('a[href*="id=1&nr="]').first();
    if (!eventLink.length) return;

    const title = eventLink.text().trim();
    const href = eventLink.attr("href") || "";
    if (!title || !href) return;

    const cagematchUrl = href.startsWith("http")
      ? href
      : `https://www.cagematch.net/${href}`;

    const cells = $row.find("td");
    let dateMatch = null;
    for (let index = 0; index < Math.min(cells.length, 4); index++) {
      dateMatch = $(cells[index]).text().trim().match(/\d{2}\.\d{2}\.\d{4}/);
      if (dateMatch) break;
    }
    if (!dateMatch) return;

    const promotionLink = $row
      .find("a")
      .filter((_, a) => (($(a).attr("href") || "").includes("id=8")))
      .first();
    const promotion =
      promotionLink.text().trim() ||
      promotionLink.find("img").attr("alt") ||
      promotionLink.find("img").attr("title") ||
      "";

    events.push({
      title,
      date: dateMatch[0],
      promotion,
      cagematchUrl,
    });
  });

  return events;
}

async function gotoAndGetHtml(page, url, waitSelector) {
  console.log(`[browser-import] Visiting ${url}`);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  if (waitSelector) {
    try {
      await page.waitForSelector(waitSelector, { timeout: 15000 });
      console.log(`[browser-import] Found selector ${waitSelector} on ${url}`);
    } catch {
      console.log(`[browser-import] Selector ${waitSelector} not found on ${url}, continuing with raw HTML`);
    }
  }
  await page.waitForTimeout(1500);
  const html = await page.content();
  console.log(`[browser-import] Retrieved ${html.length} chars from ${url}`);
  return html;
}

function dedupeEntries(entries) {
  const seen = new Set();
  return entries.filter((entry) => {
    if (seen.has(entry.cagematchUrl)) return false;
    seen.add(entry.cagematchUrl);
    return true;
  });
}

async function main() {
  const targetDate = getTargetDate();
  const cronSecret = process.env.CRON_SECRET;
  const endpoint =
    process.env.IMPORT_ENDPOINT_URL ||
    "https://poisonrana.com/api/cron/import-shows-browser";

  console.log(`[browser-import] Target date: ${targetDate}`);
  console.log(`[browser-import] Import endpoint: ${endpoint}`);

  if (!cronSecret) {
    throw new Error("CRON_SECRET is required");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 1800 },
  });

  try {
    const homepageHtml = await gotoAndGetHtml(page, "https://www.cagematch.net/", ".Caption");
    let entries = parseHomepage(homepageHtml, targetDate);
    console.log(`[browser-import] Homepage yielded ${entries.length} entries`);

    if (entries.length === 0) {
      const listUrl = `https://www.cagematch.net/?id=1&view=list&dateFrom=${targetDate}&dateTo=${targetDate}`;
      const listHtml = await gotoAndGetHtml(page, listUrl, "tr.TRow1, tr.TRow2");
      entries = parseEventList(listHtml);
      console.log(`[browser-import] List page yielded ${entries.length} entries`);
    }

    entries = dedupeEntries(entries);
    console.log(`[browser-import] ${entries.length} entries remain after dedupe`);

    if (entries.length === 0) {
      console.log("[browser-import] Homepage preview:");
      console.log(homepageHtml.slice(0, 1000));
      throw new Error(`No entries found for ${targetDate}`);
    }

    const events = [];
    for (const entry of entries) {
      console.log(`[browser-import] Fetching event page for ${entry.title} (${entry.cagematchUrl})`);
      const eventHtml = await gotoAndGetHtml(page, entry.cagematchUrl, ".InformationBoxTable, .Match, table");
      events.push({
        ...entry,
        eventHtml,
      });
    }

    console.log(`[browser-import] Posting ${events.length} scraped events to import endpoint`);

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cronSecret}`,
      },
      body: JSON.stringify({
        date: targetDate,
        source: "github-playwright",
        events,
      }),
    });

    const text = await res.text();
    console.log(`[browser-import] Import endpoint status: ${res.status}`);
    console.log(text);

    if (!res.ok) {
      throw new Error(`Import endpoint failed with ${res.status}`);
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
