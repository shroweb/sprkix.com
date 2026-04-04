import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { uniqueNewsSlug } from "@lib/slug-utils";
import { stripNewsContent } from "@lib/news";
import { sendNewsPublishedWebhook } from "@lib/news-webhook";
import { revalidatePath } from "next/cache";

function normalizeStatus(status?: string) {
  return status === "published" ? "published" : "draft";
}

function normalizeDateTime(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.newsPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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
  const publishedAt =
    normalizeDateTime(body.publishedAt) ||
    (status === "published" ? existing.publishedAt || new Date() : null);
  const slug = body.slug?.trim()
    ? await uniqueNewsSlug(body.slug.trim(), existing.id)
    : await uniqueNewsSlug(title, existing.id);

  const post = await prisma.newsPost.update({
    where: { id },
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
    },
    include: {
      author: {
        select: { name: true, slug: true },
      },
    },
  });

  const becamePublished =
    existing.status !== "published" && post.status === "published";

  if (becamePublished) {
    await sendNewsPublishedWebhook(post);
  }

  revalidatePath("/news");
  revalidatePath(`/news/${existing.slug}`);
  revalidatePath(`/news/${post.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");

  return NextResponse.json(post);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.newsPost.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.newsPost.delete({ where: { id } });

  revalidatePath("/news");
  revalidatePath(`/news/${existing.slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/news-sitemap.xml");

  return NextResponse.json({ success: true });
}
