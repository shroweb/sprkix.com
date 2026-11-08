import type { MetadataRoute } from "next";
import { getSiteUrl, SITEMAP_IDS } from "@lib/seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: [
      ...SITEMAP_IDS.map((id) => `${baseUrl}/sitemap/${id}.xml`),
      `${baseUrl}/news-sitemap.xml`,
    ],
  };
}
