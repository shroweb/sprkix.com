// Shared SEO helpers: site URL resolution and safe JSON-LD serialisation.

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com").replace(/\/$/, "");
}

/** JSON.stringify for <script type="application/ld+json">, escaping "<" to prevent script injection. */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function breadcrumbLd(items: { name: string; path: string }[]) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}

export const SITEMAP_IDS = ["pages", "events", "wrestlers", "promotions", "users", "news"] as const;
export type SitemapId = (typeof SITEMAP_IDS)[number];
