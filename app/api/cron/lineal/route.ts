import { NextResponse } from "next/server";
import { recomputeAllLinealTitles } from "@lib/lineal-data";

export const runtime = "nodejs";
export const maxDuration = 120;

// Fails closed: without CRON_SECRET nobody can trigger it.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ success: true, results: await recomputeAllLinealTitles() });
  } catch (err: any) {
    console.error("[cron] lineal failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
