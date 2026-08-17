import { NextResponse } from "next/server";
import { awardEligibleBadges } from "@lib/badges";

export const runtime = "nodejs";
export const maxDuration = 120;

const CRON_SECRET = process.env.CRON_SECRET;

function getBearerSecret(req: Request): string | null {
  const auth = req.headers.get("authorization") || "";
  const match = auth.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

/**
 * GET /api/cron/award-badges — sweep all users and award newly-eligible badges.
 * Protected by CRON_SECRET (same pattern as /api/cron/import-shows).
 */
export async function GET(req: Request) {
  if (CRON_SECRET && getBearerSecret(req) !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await awardEligibleBadges();
    return NextResponse.json({ success: true, ...summary });
  } catch (err: any) {
    console.error("[cron] Badge award sweep failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}