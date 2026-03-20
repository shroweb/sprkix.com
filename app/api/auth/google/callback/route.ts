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
    const redirectUri = `${siteUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      console.error("[Google OAuth] Token exchange failed:", tokenData);
      return NextResponse.redirect(new URL("/login?error=oauth_failed", siteUrl));
    }

    // Get user profile
    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    if (!profile.email) {
      return NextResponse.redirect(new URL("/login?error=no_email", siteUrl));
    }

    const email = profile.email.toLowerCase();
    const googleId: string = profile.id;
    const avatarUrl: string | null = profile.picture || null;

    // Generate a random wrestling-move username — user can change it after signup
    const name: string = randomWrestlingName();

    // Find existing user by googleId first, then fall back to email (account linking)
    let user = await prisma.user.findFirst({
      where: { OR: [{ googleId }, { email }] },
      select: { id: true, email: true, name: true, googleId: true },
    });

    if (user) {
      // Link googleId if signing in via email for the first time with Google
      if (!user.googleId) {
        await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      }
    } else {
      // New user — find a unique wrestling name
      let uniqueName = name;
      let counter = 2;
      while (await prisma.user.findFirst({ where: { name: { equals: uniqueName, mode: "insensitive" } } })) {
        uniqueName = `${name}-${counter++}`;
      }
      const finalName = uniqueName;

      let slug = makeSlug(finalName);
      // Ensure slug uniqueness
      while (await prisma.user.findUnique({ where: { slug } })) {
        slug = makeSlug(finalName);
      }

      user = await prisma.user.create({
        data: {
          email,
          name: finalName,
          googleId,
          avatarUrl,
          slug,
          password: null,
          isVerified: true,
          needsUsernameSetup: true,
        },
        select: { id: true, email: true, name: true, googleId: true },
      });

      // Send welcome email
      sendWelcomeEmail(user.email, user.name || "");
    }

    return buildAuthResponse(user.id, user.email, user.name, siteUrl, platform);
  } catch (err) {
    console.error("[Google OAuth] Unexpected error:", err);
    return NextResponse.redirect(new URL("/login?error=server_error", siteUrl));
  }
}
