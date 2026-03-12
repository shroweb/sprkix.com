import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { importMatchesFromCagematch } from "../../../../../lib/cagematch";
import { fetchCagematchEventInfo } from "../../../../../lib/cagematch-info";
import * as cheerio from "cheerio";

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(req: NextRequest) {
  // Protect with a secret so only your scheduler can trigger this
  if (CRON_SECRET) {
    const secret = req.nextUrl.searchParams.get("secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const listUrl =
      "https://www.cagematch.net/?id=1&view=search&sEventName=WWE+NXT+%23";
    const res = await fetch(listUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
    });
    if (!res.ok) throw new Error("Failed to fetch NXT list");
    const html = await res.text();
    const $ = cheerio.load(html);

    // Find the latest episode link
    const firstMatchLink = $(".TableContents tr")
      .filter((i) => i > 0)
      .first()
      .find("a")
      .filter((_, a) => {
        const href = $(a).attr("href");
        return !!(href && href.includes("id=1&nr="));
      })
      .first();

    if (!firstMatchLink.length)
      throw new Error("No NXT episodes found in search");

    const relativeUrl = firstMatchLink.attr("href") || "";
    const eventTitle = firstMatchLink.text().trim();
    // Cagematch hrefs are root-relative starting with "?"
    const absoluteUrl = relativeUrl.startsWith("http")
      ? relativeUrl
      : `https://www.cagematch.net/${relativeUrl.replace(/^\//, "")}`;

    const existing = await prisma.event.findFirst({
      where: {
        OR: [{ title: eventTitle }, { profightdbUrl: absoluteUrl }],
      },
    });

    if (existing) {
      return NextResponse.json({
        message: `Already have the latest episode: ${eventTitle}`,
      });
    }

    // It's a new episode — fetch info directly via the shared utility
    const info = await fetchCagematchEventInfo(absoluteUrl);

    const slug = (info.title || eventTitle)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const newEvent = await prisma.event.create({
      data: {
        title: info.title || eventTitle,
        slug: `${slug}-${Date.now()}`,
        date: info.date ? new Date(info.date) : new Date(),
        promotion: info.promotion || "WWE",
        posterUrl: info.posterUrl || null,
        profightdbUrl: absoluteUrl,
        type: info.type || "tv",
      },
    });

    await importMatchesFromCagematch(newEvent.id, absoluteUrl);

    return NextResponse.json({
      success: true,
      message: `Successfully imported new episode: ${newEvent.title}`,
      id: newEvent.id,
    });
  } catch (error: any) {
    console.error("NXT Sync Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
