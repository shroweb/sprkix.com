import { randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE_PREFIX = "oauth_state_";
const MAX_AGE_SECONDS = 60 * 10;

function getCookieName(provider: string) {
  return `${COOKIE_PREFIX}${provider}`;
}

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a);
  const bBuffer = Buffer.from(b);
  if (aBuffer.length !== bBuffer.length) return false;
  return timingSafeEqual(aBuffer, bBuffer);
}

export async function createOAuthState(
  provider: "google" | "facebook",
  platform: string,
  response: NextResponse,
) {
  const nonce = randomBytes(24).toString("base64url");
  const state = Buffer.from(JSON.stringify({ platform, nonce })).toString("base64url");

  response.cookies.set({
    name: getCookieName(provider),
    value: nonce,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: MAX_AGE_SECONDS,
  });

  return state;
}

export async function consumeOAuthState(
  provider: "google" | "facebook",
  stateRaw: string | null,
) {
  const cookieStore = await cookies();
  const cookieName = getCookieName(provider);
  const expectedNonce = cookieStore.get(cookieName)?.value;

  cookieStore.delete(cookieName);

  if (!stateRaw || !expectedNonce) {
    return { valid: false, platform: "web" };
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(stateRaw, "base64url").toString("utf-8"),
    ) as { platform?: string; nonce?: string };

    if (!parsed.nonce || !safeCompare(parsed.nonce, expectedNonce)) {
      return { valid: false, platform: "web" };
    }

    return {
      valid: true,
      platform: parsed.platform === "app" ? "app" : "web",
    };
  } catch {
    return { valid: false, platform: "web" };
  }
}
