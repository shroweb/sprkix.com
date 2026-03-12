import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { revalidatePath } from "next/cache";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(prisma as any).siteConfig) {
    return NextResponse.json({ configs: {}, events: [] });
  }

  const [configs, events] = await Promise.all([
    (prisma as any).siteConfig.findMany(),
    prisma.event.findMany({
      select: {
        id: true,
        title: true,
        promotion: true,
        date: true,
        slug: true,
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const mapped = (configs || []).reduce((acc: any, curr: any) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});

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

  const body = await req.json();
  const {
    HERO_TITLE,
    HERO_DESC,
    HERO_IMAGE,
    FEATURED_EVENT_ID,
    SITE_LOGO,
    BANNER_TEXT,
    BANNER_LINK,
    BANNER_ENABLED,
  } = body;

  const updates = [
    { key: "HERO_TITLE", value: HERO_TITLE },
    { key: "HERO_DESC", value: HERO_DESC },
    { key: "HERO_IMAGE", value: HERO_IMAGE },
    { key: "FEATURED_EVENT_ID", value: FEATURED_EVENT_ID },
    { key: "SITE_LOGO", value: SITE_LOGO },
    { key: "BANNER_TEXT", value: BANNER_TEXT },
    { key: "BANNER_LINK", value: BANNER_LINK },
    { key: "BANNER_ENABLED", value: BANNER_ENABLED },
  ];

  for (const update of updates) {
    if (update.value !== undefined) {
      await (prisma as any).siteConfig.upsert({
        where: { key: update.key },
        update: { value: update.value },
        create: { key: update.key, value: update.value },
      });
    }
  }

  revalidatePath("/");

  return NextResponse.json({ success: true });
}
