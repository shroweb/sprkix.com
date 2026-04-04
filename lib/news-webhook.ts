type NewsWebhookPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: { name: string | null; slug: string } | null;
};

function getWebhookUrl() {
  return process.env.NEWS_PUBLISH_WEBHOOK_URL || "";
}

export async function sendNewsPublishedWebhook(post: NewsWebhookPost) {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) return;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const publishedAt = post.publishedAt || post.createdAt;
  const articleUrl = `${siteUrl}/news/${post.slug}`;

  const payload = {
    event: "news.published",
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    url: articleUrl,
    coverImage: post.coverImage,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    publishedAt: publishedAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    author: post.author?.name
      ? {
          name: post.author.name,
          slug: post.author.slug,
          url: `${siteUrl}/users/${post.author.slug}`,
        }
      : null,
  };

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("News webhook failed:", response.status, await response.text());
    }
  } catch (error) {
    console.error("News webhook error:", error);
  }
}
