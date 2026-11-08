import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { parseCagematchEventInfo } from "@lib/cagematch";
import { uniqueEventSlug } from "@lib/slug-utils";

export async function POST(req: Request) {
  try {
    const user = await getUserFromServerCookie();
    if (!user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url, options = {} } = await req.json();
    if (!url || !url.includes("cagematch.net")) {
      return NextResponse.json({ error: "Valid Cagematch URL is required" }, { status: 400 });
    }

    // Default all options to true if unspecified
    const opts = {
      importTitleAndDate: true,
      importVenueAndCity: true,
      importPosters: true,
      importMatchCards: true,
      importMatchDurations: true,
      autoCreateWrestlers: true,
      importAttendanceAndNetwork: true,
      ...options,
    };

    // Fetch HTML via fetch (or ScraperAPI if configured)
    const scraperApiKey = process.env.SCRAPER_API_KEY;
    const targetUrl = scraperApiKey
      ? `http://api.scraperapi.com?api_key=${scraperApiKey}&url=${encodeURIComponent(url)}`
      : url;

    const res = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    if (!res.ok) {
      return NextResponse.json({ error: `Fetch failed: ${res.statusText}` }, { status: 502 });
    }

    const html = await res.text();
    const parsed = parseCagematchEventInfo(html);

    if (!parsed.title && opts.importTitleAndDate) {
      return NextResponse.json({ error: "Could not parse event title from Cagematch HTML" }, { status: 422 });
    }

    const dateObj = parsed.date ? new Date(parsed.date) : new Date();
    const promotionName = parsed.promotion || "WWE";
    const titleToUse = (opts.importTitleAndDate && parsed.title) ? parsed.title : "Untitled Imported Show";
    const slug = await uniqueEventSlug(titleToUse);

    const event = await prisma.event.create({
      data: {
        title: titleToUse,
        slug,
        promotion: promotionName,
        date: opts.importTitleAndDate ? dateObj : new Date(),
        venue: opts.importVenueAndCity ? parsed.venue || undefined : undefined,
        city: opts.importVenueAndCity ? parsed.city || undefined : undefined,
        attendance: opts.importAttendanceAndNetwork ? parsed.attendance || undefined : undefined,
      },
    });

    return NextResponse.json({ success: true, event, optionsUsed: opts });
  } catch (err: any) {
    console.error("Cagematch URL import error:", err);
    return NextResponse.json({ error: err.message || "Import failed" }, { status: 500 });
  }
}
