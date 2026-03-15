import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.poisonrana.com";

  const config = await (prisma as any).siteConfig
    .findUnique({ where: { key: "SOCIAL_LOGIN_ENABLED" } })
    .catch(() => null);

  if (!config || config.value !== "true") {
    return NextResponse.redirect(new URL("/login?error=social_disabled", siteUrl));
  }

  if (!process.env.FACEBOOK_APP_ID) {
    return NextResponse.redirect(new URL("/login?error=config", siteUrl));
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || "web"; // "app" for mobile deep-link flow

  const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

  // Encode platform in state so the callback knows where to redirect
  const state = Buffer.from(JSON.stringify({ platform })).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.FACEBOOK_APP_ID,
    redirect_uri: redirectUri,
    scope: "email,public_profile",
    response_type: "code",
    state,
  });

  return NextResponse.redirect(
    `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`
  );
}
