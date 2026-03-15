import * as cheerio from "cheerio";
import type { EnrichmentResult } from "./types";

const UA = "PoisonRana/1.0 (https://poisonrana.com; hello@poisonrana.com)";

/** Search Wikipedia for a wrestling event and return the best matching page title */
export async function searchWikipedia(query: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=5&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const [, titles] = await res.json() as [string, string[]];
  return titles?.[0] ?? null;
}

/** Fetch enrichment data from a Wikipedia page title */
export async function fetchWikipediaEnrichment(pageTitle: string): Promise<EnrichmentResult | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=text&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;

  const json = await res.json() as any;
  const html: string = json?.parse?.text?.["*"];
  if (!html) return null;

  const $ = cheerio.load(html);
  const result: EnrichmentResult = {
    sourceUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle)}`,
  };

  // Parse the infobox table
  $(".infobox tr").each((_, row) => {
    const label = $(row).find("th").text().trim().toLowerCase();
    const value = $(row).find("td").text().trim().replace(/\[\d+\]/g, "").trim();

    if (!value) return;

    if (label.includes("venue")) {
      result.venue = value.split("\n")[0].trim();
    }
    if (label.includes("city") || label.includes("location")) {
      result.city = value.split("\n")[0].trim();
    }
    if (label.includes("attendance")) {
      const num = parseInt(value.replace(/[^0-9]/g, ""));
      if (!isNaN(num) && num > 0) result.attendance = num;
    }
    if (label.includes("network") || label.includes("channel") || label.includes("broadcast")) {
      result.network = value.split("\n")[0].trim();
    }
  });

  // Grab the opening paragraph as description if we don't have one
  const intro = $(".mw-parser-output > p").not(".mw-empty-elt").first().text()
    .replace(/\[\d+\]/g, "").trim();
  if (intro.length > 50) result.description = intro.slice(0, 500);

  // Grab infobox image
  const img = $(".infobox img").first().attr("src");
  if (img) result.posterUrl = img.startsWith("//") ? `https:${img}` : img;

  return Object.keys(result).length > 1 ? result : null;
}

/** Convenience: search then fetch in one call */
export async function enrichFromWikipedia(eventTitle: string, year?: number): Promise<EnrichmentResult | null> {
  const query = year ? `${eventTitle} ${year}` : eventTitle;
  const pageTitle = await searchWikipedia(query);
  if (!pageTitle) return null;
  return fetchWikipediaEnrichment(pageTitle);
}
