import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import jwt from "jsonwebtoken";
import { randomWrestlingName } from "@lib/wrestling-names";
import { sendWelcomeEmail } from "@lib/mail";

function makeSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

function buildAuthResponse(
  userId: string,
  email: string,
  name: string | null,
  siteUrl: string,
  platform: string = "web",
) {
  const token = jwt.sign(
    { userId, email, name },
    process.env.JWT_SECRET!,
    { expiresIn: "7d" }
  );

  // Mobile app — redirect to deep link so the app can capture the token
  if (platform === "app") {
    const deepLink = `poisonrana://auth?token=${encodeURIComponent(token)}`;
    return NextResponse.redirect(deepLink);
  }

  // Web — set httpOnly cookie and redirect to home
  const response = NextResponse.redirect(new URL("/", siteUrl));
  response.cookies.set({
    name: "token",
    value: token,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7,
    sameSite: "lax",
  });
  return response;
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.poisonrana.com";
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Decode platform from state (passed through from the initiation route)
  let platform = "web";
  try {
    const stateRaw = searchParams.get("state");
    if (stateRaw) {
      const stateJson = Buffer.from(stateRaw, "base64url").toString("utf-8");
      platform = JSON.parse(stateJson).platform || "web";
    }
  } catch {
    // Ignore malformed state — default to web
  }

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
    const facebookId: string = profile.id;

    // Generate a random wrestling-move username — user can change it after signup
    const name: string = randomWrestlingName();
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
      // Find a unique wrestling name
      let uniqueName = name;
      let counter = 2;
      while (await prisma.user.findFirst({ where: { name: { equals: uniqueName, mode: "insensitive" } } })) {
        uniqueName = `${name}-${counter++}`;
      }
      const finalName = uniqueName;

      let slug = makeSlug(finalName);
      while (await prisma.user.findUnique({ where: { slug } })) {
        slug = makeSlug(finalName);
      }

      user = await prisma.user.create({
        data: {
          email,
          name: finalName,
          facebookId,
          avatarUrl,
          slug,
          password: null,
          isVerified: true,
          needsUsernameSetup: true,
        },
        select: { id: true, email: true, name: true, facebookId: true },
      });

      // Send welcome email
      await sendWelcomeEmail(user.email, user.name || "");
    }

    return buildAuthResponse(user.id, user.email, user.name, siteUrl, platform);
  } catch (err) {
    console.error("[Facebook OAuth] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", siteUrl));
  }
}
