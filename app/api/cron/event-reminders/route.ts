import { NextResponse } from "next/server";
import { sendEventReminders } from "@lib/reminders";

export const runtime = "nodejs";
export const maxDuration = 120;

// These routes send email, so unlike the import cron they fail closed:
// no CRON_SECRET configured means nobody can trigger them.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i)?.[1];
  if (!secret || bearer !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    return NextResponse.json({ success: true, ...(await sendEventReminders()) });
  } catch (err: any) {
    console.error("[cron] event-reminders failed:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
