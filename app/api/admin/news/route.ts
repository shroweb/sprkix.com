import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { uniqueNewsSlug } from "@lib/slug-utils";
import { stripNewsContent } from "@lib/news";
import { revalidatePath } from "next/cache";

function normalizeStatus(status?: string) {
  return status === "published" ? "published" : "draft";
}

function normalizeDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const posts = await prisma.newsPost.findMany({
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  return NextResponse.json(posts);
}

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const title = (body.title || "").trim();
  const excerpt = (body.excerpt || "").trim();
  const content = (body.content || "").trim();
  const plainTextContent = stripNewsContent(content);

  if (!title || !excerpt || !content || !plainTextContent) {
    return NextResponse.json(
      { error: "Title, excerpt, and content are required" },
      { status: 400 },
    );
  }

  const status = normalizeStatus(body.status);
  const publishedAt = normalizeDateTime(body.publishedAt) || (status === "published" ? new Date() : null);
  const slug = body.slug?.trim() ? await uniqueNewsSlug(body.slug.trim()) : await uniqueNewsSlug(title);

  const post = await prisma.newsPost.create({
    data: {
      title,
      slug,
      excerpt,
      content,
      coverImage: body.coverImage?.trim() || null,
      seoTitle: body.seoTitle?.trim() || null,
      seoDescription: body.seoDescription?.trim() || null,
      status,
      featured: !!body.featured,
      publishedAt,
      authorId: user.id,
    },
  });

  revalidatePath("/news");
  revalidatePath(`/news/${post.slug}`);
  revalidatePath("/sitemap.xml");

  return NextResponse.json(post);
}
