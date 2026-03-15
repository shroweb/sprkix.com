import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import jwt from "jsonwebtoken";

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function buildAuthResponse(userId: string, email: string, name: string | null, siteUrl: string) {
  const token = jwt.sign(
    { userId, email, name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );
  const response = NextResponse.redirect(new URL("/", siteUrl));
  response.cookies.set({
    name: "token",
    value: token,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.poisonrana.com";
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=oauth_cancelled", siteUrl));
  }

  try {
    const redirectUri = `${siteUrl}/api/auth/facebook/callback`;

    // Exchange code for access token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?${new URLSearchParams({
        client_id: process.env.FACEBOOK_APP_ID!,
        client_secret: process.env.FACEBOOK_APP_SECRET!,
        redirect_uri: redirectUri,
        code,
      })}`
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Facebook OAuth] Token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/login?error=oauth_failed", siteUrl));
    }

    // Get user profile
    const profileRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`
    );
    const profile = await profileRes.json();

    if (!profile.email) {
      // Facebook sometimes withholds email — handle gracefully
      return NextResponse.redirect(new URL("/login?error=no_email", siteUrl));
    }

    const email = profile.email.toLowerCase();
    const name: string = profile.name || email.split("@")[0];
    const facebookId: string = profile.id;
    const avatarUrl: string | null = profile.picture?.data?.url || null;

    // Find existing user by facebookId first, then fall back to email (account linking)
    let user = await prisma.user.findFirst({
      where: { OR: [{ facebookId }, { email }] },
      select: { id: true, email: true, name: true, facebookId: true },
    });

    if (user) {
      if (!user.facebookId) {
        await prisma.user.update({ where: { id: user.id }, data: { facebookId } });
      }
    } else {
      let slug = makeSlug(name);
      while (await prisma.user.findUnique({ where: { slug } })) {
        slug = makeSlug(name);
      }

      user = await prisma.user.create({
        data: {
          email,
          name,
          facebookId,
          avatarUrl,
          slug,
          password: null,
          isVerified: true,
        },
        select: { id: true, email: true, name: true, facebookId: true },
      });
    }

    return buildAuthResponse(user.id, user.email, user.name, siteUrl);
  } catch (err) {
    console.error("[Facebook OAuth] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", siteUrl));
  }
}
