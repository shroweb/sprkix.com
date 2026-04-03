import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock3 } from "lucide-react";
import type { Metadata } from "next";
import NewsContent from "@components/NewsContent";
import { stripNewsShortcodes } from "@lib/news";

async function getNewsPost(slug: string) {
  return prisma.newsPost.findFirst({
    where: {
      slug,
      status: "published",
      publishedAt: { lte: new Date() },
    },
    include: {
      author: { select: { name: true, slug: true } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription || post.excerpt || stripNewsShortcodes(post.content).slice(0, 155);
  const url = `${siteUrl}/news/${post.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      authors: post.author?.name ? [post.author.name] : undefined,
      images: post.coverImage ? [{ url: post.coverImage }] : undefined,
    },
    twitter: {
      card: post.coverImage ? "summary_large_image" : "summary",
      title,
      description,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getNewsPost(slug);
  if (!post) return notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const publishedAt = post.publishedAt || post.createdAt;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    datePublished: publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.author?.name
      ? {
          "@type": "Person",
          name: post.author.name,
          url: `${siteUrl}/users/${post.author.slug}`,
        }
      : undefined,
    publisher: {
      "@type": "Organization",
      name: "Poison Rana",
      url: siteUrl,
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/api/site/favicon`,
      },
    },
    image: post.coverImage ? [post.coverImage] : undefined,
    mainEntityOfPage: `${siteUrl}/news/${post.slug}`,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link
        href="/news"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to News
      </Link>

      <article className="space-y-8">
        <header className="space-y-5">
          <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">News Article</p>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
            {post.title}
          </h1>
          <p className="text-xl text-foreground/80 leading-8">{post.excerpt}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="w-3.5 h-3.5 text-primary" />
              {publishedAt.toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
            {post.author?.name ? (
              <span>
                By <Link href={`/users/${post.author.slug}`} className="text-primary hover:underline">{post.author.name}</Link>
              </span>
            ) : null}
          </div>
        </header>

        {post.coverImage ? (
          <div className="relative aspect-[16/9] rounded-[2rem] overflow-hidden border border-white/5">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" priority />
          </div>
        ) : null}

        <div className="rounded-[2rem] border border-white/5 bg-card/20 p-6 sm:p-8 md:p-10">
          <NewsContent content={post.content} />
        </div>
      </article>
    </div>
  );
}
