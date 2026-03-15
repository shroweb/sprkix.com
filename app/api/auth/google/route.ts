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

  if (!process.env.GOOGLE_CLIENT_ID) {
    return NextResponse.redirect(new URL("/login?error=config", siteUrl));
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get("platform") || "web"; // "app" for mobile deep-link flow

  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  // Encode platform in state so the callback knows where to redirect
  const state = Buffer.from(JSON.stringify({ platform })).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
