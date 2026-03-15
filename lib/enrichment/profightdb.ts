import * as cheerio from "cheerio";
import type { EnrichmentResult } from "./types";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36";

/**
 * Enrich an event from a ProfightDB event page.
 * URL format: https://www.profightdb.com/events/{id}/{slug}.html
 */
export async function fetchProfightDbEnrichment(url: string): Promise<EnrichmentResult | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);
  const result: EnrichmentResult = { sourceUrl: url };

  // ProfightDB uses a standard info table
  const infoMap: Record<string, string> = {};
  $("table.info tr, .event-info tr, table tr").each((_, row) => {
    const cells = $(row).find("td");
    if (cells.length >= 2) {
      const label = $(cells[0]).text().trim().replace(/:$/, "").toLowerCase();
      const value = $(cells[1]).text().trim().replace(/\s+/g, " ");
      if (label && value) infoMap[label] = value;
    }
  });

  // Also try th/td pairs
  $("table tr").each((_, row) => {
    const th = $(row).find("th").text().trim().replace(/:$/, "").toLowerCase();
    const td = $(row).find("td").text().trim().replace(/\s+/g, " ");
    if (th && td) infoMap[th] = td;
  });

  // Venue
  const venue =
    infoMap["venue"] ||
    infoMap["arena"] ||
    infoMap["location"] ||
    infoMap["building"];
  if (venue) result.venue = venue.split(",")[0].trim();

  // City
  const location = infoMap["city"] || infoMap["location"] || infoMap["venue"];
  if (location) {
    const parts = location.split(",").map((s: string) => s.trim());
    if (parts.length > 1) result.city = parts.slice(1).join(", ");
    else if (!result.venue) result.city = parts[0]; // fallback if no venue
  }

  // Attendance
  const att =
    infoMap["attendance"] ||
    infoMap["crowd"] ||
    infoMap["gate"];
  if (att) {
    const num = parseInt(att.replace(/[^0-9]/g, ""));
    if (!isNaN(num) && num > 0) result.attendance = num;
  }

  // Network / broadcast
  const network =
    infoMap["broadcast"] ||
    infoMap["network"] ||
    infoMap["tv"] ||
    infoMap["channel"];
  if (network) result.network = network;

  // Poster — look for the event image
  const img =
    $("img.event-poster, .event-image img, img[src*='/events/']").first().attr("src") ||
    $(".event-header img, .card img").first().attr("src");
  if (img) result.posterUrl = img.startsWith("http") ? img : `https://www.profightdb.com${img}`;

  return Object.keys(result).length > 1 ? result : null;
}

/**
 * Enrich from a Cagematch event page (re-uses existing info parser logic
 * but returns an EnrichmentResult shape instead of CagematchEventInfo).
 */
export async function fetchCagematchEnrichment(url: string): Promise<EnrichmentResult | null> {
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);
  const result: EnrichmentResult = { sourceUrl: url };

  const infoMap: Record<string, string> = {};
  const titles = $(".InformationBoxTitle").toArray();
  const contents = $(".InformationBoxContents").toArray();
  titles.forEach((el, i) => {
    const label = $(el).text().trim().replace(/:$/, "").toLowerCase();
    const value = contents[i] ? $(contents[i]).text().trim() : "";
    if (label && value) infoMap[label] = value;
  });

  const venue = infoMap["arena"] || infoMap["location"] || infoMap["venue"];
  if (venue) {
    const parts = venue.split(",").map((s: string) => s.trim());
    result.venue = parts[0];
    if (parts.length > 1) result.city = parts.slice(1).join(", ");
  }

  const att = infoMap["attendance"];
  if (att) {
    const num = parseInt(att.replace(/[^0-9]/g, ""));
    if (!isNaN(num) && num > 0) result.attendance = num;
  }

  const network = infoMap["broadcast"] || infoMap["network"] || infoMap["tv"];
  if (network) result.network = network;

  let posterUrl = "";
  const imageEl = $("img[src*='pics/']").first();
  if (imageEl.length) {
    const src = imageEl.attr("src") || "";
    posterUrl = src.startsWith("http") ? src : `https://www.cagematch.net/${src.replace(/^\//, "")}`;
  }
  if (posterUrl) result.posterUrl = posterUrl;

  return Object.keys(result).length > 1 ? result : null;
}
