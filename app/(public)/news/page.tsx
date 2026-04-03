import { prisma } from "@lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Clock3 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wrestling News",
  description:
    "Latest wrestling news, analysis, and updates from Poison Rana, with internal links to events, wrestlers, and promotions.",
  alternates: { canonical: "/news" },
  openGraph: {
    title: "Wrestling News | Poison Rana",
    description:
      "Latest wrestling news, analysis, and updates from Poison Rana.",
    type: "website",
    url: "/news",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wrestling News | Poison Rana",
    description:
      "Latest wrestling news, analysis, and updates from Poison Rana.",
  },
};

export default async function NewsIndexPage() {
  const posts = await prisma.newsPost.findMany({
    where: {
      status: "published",
      publishedAt: { lte: new Date() },
    },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    include: {
      author: { select: { name: true, slug: true } },
    },
  });

  const [featured, ...rest] = posts;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="space-y-3">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-primary">Poison Rana News</p>
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black italic uppercase tracking-tighter">
          Wrestling News
        </h1>
        <p className="text-muted-foreground font-medium italic max-w-2xl">
          Fresh wrestling coverage built for search, discovery, and deep internal linking.
        </p>
      </div>

      {featured ? (
        <Link
          href={`/news/${featured.slug}`}
          className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 rounded-[2rem] border border-white/5 bg-card/40 overflow-hidden hover:border-primary/30 transition-colors"
        >
          <div className="p-6 sm:p-8 space-y-5">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              Featured Story
            </div>
            <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight">
              {featured.title}
            </h2>
            <p className="text-base text-foreground/80 leading-7">{featured.excerpt}</p>
            <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="w-3.5 h-3.5 text-primary" />
                {new Date(featured.publishedAt || featured.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </span>
              {featured.author?.name ? <span>By {featured.author.name}</span> : null}
            </div>
          </div>
          <div className="relative min-h-[260px]">
            {featured.coverImage ? (
              <Image src={featured.coverImage} alt={featured.title} fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.22),transparent_45%),linear-gradient(135deg,#020617_0%,#111827_100%)]" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          </div>
        </Link>
      ) : null}

      <div className="grid md:grid-cols-2 gap-6">
        {rest.map((post) => (
          <Link
            key={post.id}
            href={`/news/${post.slug}`}
            className="group rounded-[2rem] border border-white/5 bg-card/30 overflow-hidden hover:border-primary/30 transition-colors"
          >
            <div className="relative aspect-[16/9]">
              {post.coverImage ? (
                <Image src={post.coverImage} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_45%),linear-gradient(135deg,#020617_0%,#111827_100%)]" />
              )}
            </div>
            <div className="p-6 space-y-3">
              <h2 className="text-2xl font-black italic uppercase tracking-tight group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-foreground/75 leading-6">{post.excerpt}</p>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {new Date(post.publishedAt || post.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
