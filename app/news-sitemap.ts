import { MetadataRoute } from "next";
import { prisma } from "@lib/prisma";

export default async function newsSitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";

  try {
    const posts = await prisma.newsPost.findMany({
      where: {
        status: "published",
        publishedAt: { lte: new Date() },
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    return posts.map((post) => ({
      url: `${baseUrl}/news/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "daily",
      priority: 0.8,
    }));
  } catch (error) {
    console.error("News sitemap fetch error:", error);
    return [];
  }
}
