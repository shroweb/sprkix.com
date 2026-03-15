import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

// Public endpoint — tells the login page whether social login is enabled
export async function GET() {
  const config = await (prisma as any).siteConfig
    .findUnique({ where: { key: "SOCIAL_LOGIN_ENABLED" } })
    .catch(() => null);

  const enabled = config?.value === "true";

  return NextResponse.json({
    enabled,
    google: enabled && !!process.env.GOOGLE_CLIENT_ID,
    facebook: enabled && !!process.env.FACEBOOK_APP_ID,
  });
}
