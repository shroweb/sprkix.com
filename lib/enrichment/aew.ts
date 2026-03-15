import * as cheerio from "cheerio";
import type { EnrichmentResult } from "./types";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

/**
 * Fetch event enrichment data from an AEW event page.
 * URL format: https://www.allelitewrestling.com/aew-event/{slug}
 */
export async function fetchAewEnrichment(aewUrl: string): Promise<EnrichmentResult | null> {
  const res = await fetch(aewUrl, {
    headers: { "User-Agent": UA, "Accept": "text/html,application/xhtml+xml" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;

  const html = await res.text();
  const $ = cheerio.load(html);
  const result: EnrichmentResult = { sourceUrl: aewUrl };

  // Poster image — AEW uses large hero/header images
  const heroImg =
    $('meta[property="og:image"]').attr("content") ||
    $(".event-hero img, .hero-image img, .event-banner img").first().attr("src");
  if (heroImg) result.posterUrl = heroImg;

  // Venue / City — AEW often puts this in structured data or a visible block
  const jsonLd = $('script[type="application/ld+json"]').first().text();
  if (jsonLd) {
    try {
      const data = JSON.parse(jsonLd);
      const location = data?.location ?? data?.[0]?.location;
      if (location) {
        result.venue = location?.name ?? location;
        const addr = location?.address;
        if (addr) {
          const parts = [addr.addressLocality, addr.addressRegion, addr.addressCountry]
            .filter(Boolean);
          if (parts.length) result.city = parts.join(", ");
        }
      }
      // Network
      if (data?.broadcastOfEvent?.broadcastChannel || data?.broadcastChannel) {
        result.network = data?.broadcastOfEvent?.broadcastChannel ?? data?.broadcastChannel;
      }
    } catch { /* ignore parse errors */ }
  }

  // Fallback: scrape visible text blocks
  if (!result.venue) {
    const venueText = $(".event-location, .venue, [class*='venue'], [class*='location']").first().text().trim();
    if (venueText) {
      const parts = venueText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      if (parts[0]) result.venue = parts[0];
      if (parts[1]) result.city = parts.slice(1).join(", ");
    }
  }

  return Object.keys(result).length > 1 ? result : null;
}
