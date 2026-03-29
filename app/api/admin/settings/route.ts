import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";
import { uploadDataUrl } from "@lib/uploads";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(prisma as any).siteConfig) {
    return NextResponse.json({ configs: {}, events: [] });
  }

  // Fetch small config rows and large image fields separately to stay under
  // Prisma Accelerate's 5 MB response limit.
  const [configs, logoRow, heroRow, faviconRow, events] = await Promise.all([
    (prisma as any).siteConfig.findMany({
      where: { key: { notIn: ["SITE_LOGO", "HERO_IMAGE", "FAVICON"] } },
    }),
    (prisma as any).siteConfig
      .findUnique({ where: { key: "SITE_LOGO" }, select: { key: true, value: true } })
      .catch(() => null),
    (prisma as any).siteConfig
      .findUnique({ where: { key: "HERO_IMAGE" }, select: { key: true, value: true } })
      .catch(() => null),
    (prisma as any).siteConfig
      .findUnique({ where: { key: "FAVICON" }, select: { key: true, value: true } })
      .catch(() => null),
    prisma.event.findMany({
      select: { id: true, title: true, promotion: true, date: true, slug: true },
      orderBy: { date: "desc" },
    }),
  ]);

  const mapped = (configs || []).reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, string>);
  if (logoRow) mapped["SITE_LOGO"] = logoRow.value;
  if (heroRow) mapped["HERO_IMAGE"] = heroRow.value;
  if (faviconRow) mapped["FAVICON"] = faviconRow.value;

  return NextResponse.json({ configs: mapped, events });
}

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(prisma as any).siteConfig) {
    return NextResponse.json(
      { error: "System not ready. Please try again in 30 seconds." },
      { status: 503 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to parse request body", detail: e?.message },
      { status: 400 },
    );
  }

  const {
    HERO_TITLE,
    HERO_DESC,
    HERO_IMAGE,
    FEATURED_EVENT_ID,
    SITE_LOGO,
    FAVICON,
    LOGO_SIZE,
    BANNER_TEXT,
    BANNER_LINK,
    BANNER_ENABLED,
    SITE_TAGLINE,
    SITE_DESCRIPTION,
    PRIMARY_COLOR,
    PRIMARY_HOVER_COLOR,
    SOCIAL_LOGIN_ENABLED,
  } = body;

  let heroImageValue = HERO_IMAGE;
  let siteLogoValue = SITE_LOGO;
  let faviconValue = FAVICON;

  try {
    if (typeof HERO_IMAGE === "string" && HERO_IMAGE.startsWith("data:")) {
      heroImageValue = (
        await uploadDataUrl({
          dataUrl: HERO_IMAGE,
          folder: "settings",
          prefix: "hero-image",
        })
      ).url;
    }
    if (typeof SITE_LOGO === "string" && SITE_LOGO.startsWith("data:")) {
      siteLogoValue = (
        await uploadDataUrl({
          dataUrl: SITE_LOGO,
          folder: "settings",
          prefix: "site-logo",
        })
      ).url;
    }
    if (typeof FAVICON === "string" && FAVICON.startsWith("data:")) {
      faviconValue = (
        await uploadDataUrl({
          dataUrl: FAVICON,
          folder: "settings",
          prefix: "favicon",
        })
      ).url;
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: "Failed to process uploaded site images", detail: e?.message },
      { status: 500 },
    );
  }

  const updates = [
    { key: "HERO_TITLE", value: HERO_TITLE },
    { key: "HERO_DESC", value: HERO_DESC },
    { key: "HERO_IMAGE", value: heroImageValue },
    { key: "FEATURED_EVENT_ID", value: FEATURED_EVENT_ID },
    { key: "SITE_LOGO", value: siteLogoValue },
    { key: "FAVICON", value: faviconValue },
    { key: "LOGO_SIZE", value: LOGO_SIZE },
    { key: "BANNER_TEXT", value: BANNER_TEXT },
    { key: "BANNER_LINK", value: BANNER_LINK },
    { key: "BANNER_ENABLED", value: BANNER_ENABLED },
    { key: "SITE_TAGLINE", value: SITE_TAGLINE },
    { key: "SITE_DESCRIPTION", value: SITE_DESCRIPTION },
    { key: "PRIMARY_COLOR", value: PRIMARY_COLOR },
    { key: "PRIMARY_HOVER_COLOR", value: PRIMARY_HOVER_COLOR },
    { key: "SOCIAL_LOGIN_ENABLED", value: SOCIAL_LOGIN_ENABLED },
  ];

  try {
    for (const update of updates) {
      if (update.value !== undefined) {
        await (prisma as any).siteConfig.upsert({
          where: { key: update.key },
          update: { value: update.value },
          create: { key: update.key, value: update.value },
          select: { key: true }, // don't return value — base64 blows Prisma Accelerate 5 MB limit
        });
      }
    }
  } catch (e: any) {
    console.error("[admin/settings POST] DB error:", e);
    return NextResponse.json(
      { error: "Database error", detail: e?.message },
      { status: 500 },
    );
  }

  revalidatePath("/", "layout");

  return NextResponse.json({ success: true });
}
