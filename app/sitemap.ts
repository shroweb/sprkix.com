import type { MetadataRoute } from "next";
import { prisma } from "@lib/prisma";
import { getSiteUrl, SITEMAP_IDS, type SitemapId } from "@lib/seo";

// One sitemap per content type (/sitemap/<id>.xml). Keeps each file far below
// Google's 50k-URL limit as the catalogue grows and makes indexing per type
// visible in Search Console.

const STATIC_ROUTES = [
  "",
  "/events",
  "/wrestlers",
  "/promotions",
  "/news",
  "/rankings",
  "/matches/finder",
  "/leaderboard",
  "/lineal",
  "/lists",
  "/polls",
  "/faq",
  "/contact",
  "/privacy",
  "/terms",
];

// The database isn't reachable during `next build`, so a prerendered sitemap would be
// baked in empty. Render on request instead.
export const dynamic = "force-dynamic";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  const id = (await props.id) as SitemapId;
  const baseUrl = getSiteUrl();
  const now = new Date();

  try {
    switch (id) {
      case "pages":
        return STATIC_ROUTES.map((route) => ({
          url: `${baseUrl}${route}`,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: route === "" ? 1 : 0.8,
        }));

      case "events": {
        const events = await prisma.event.findMany({
          select: { slug: true, date: true, createdAt: true },
        });
        return events.map((e) => ({
          url: `${baseUrl}/events/${e.slug}`,
          // Past events are settled; upcoming ones are still changing.
          lastModified: e.date <= now ? e.date : e.createdAt,
          changeFrequency: e.date <= now ? ("monthly" as const) : ("daily" as const),
          priority: e.date <= now ? 0.6 : 0.8,
        }));
      }

      case "wrestlers": {
        const rows = await prisma.wrestler.findMany({ select: { slug: true, createdAt: true } });
        return rows.map((w) => ({
          url: `${baseUrl}/wrestlers/${w.slug}`,
          lastModified: w.createdAt,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }));
      }

      case "promotions": {
        const rows = await prisma.promotion.findMany({ select: { shortName: true, createdAt: true } });
        return rows.map((p) => ({
          url: `${baseUrl}/promotions/${slugify(p.shortName)}`,
          lastModified: p.createdAt,
          changeFrequency: "weekly" as const,
          priority: 0.5,
        }));
      }

      case "users": {
        const rows = await prisma.user.findMany({ select: { slug: true, createdAt: true } });
        return rows.map((u) => ({
          url: `${baseUrl}/users/${u.slug}`,
          lastModified: u.createdAt,
          changeFrequency: "monthly" as const,
          priority: 0.4,
        }));
      }

      case "news": {
        const rows = await prisma.newsPost.findMany({
          where: { status: "published", publishedAt: { lte: now } },
          select: { slug: true, updatedAt: true },
        });
        return rows.map((p) => ({
          url: `${baseUrl}/news/${p.slug}`,
          lastModified: p.updatedAt,
          changeFrequency: "weekly" as const,
          priority: 0.7,
        }));
      }
    }
  } catch (error) {
    console.error(`Sitemap "${id}" fetch error:`, error);
  }
  return [];
}
