import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/server-auth";

export const runtime = "nodejs";
export const maxDuration = 300;

// Triggers the cron import for each date in a range.
// GET /api/admin/bulk-import?from=2025-01-01&to=2025-03-23
export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user || !(user as any).isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  if (!from || !to) {
    return NextResponse.json({ error: "from and to params required (YYYY-MM-DD)" }, { status: 400 });
  }

  const start = new Date(from);
  const end = new Date(to);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const results: { date: string; status: string; imported?: number }[] = [];

  const current = new Date(start);
  while (current <= end) {
    const dateStr = current.toISOString().split("T")[0];
    try {
      const res = await fetch(`${siteUrl}/api/cron/import-shows?date=${dateStr}`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` },
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      results.push({ date: dateStr, status: "ok", imported: data.imported ?? 0 });
    } catch (err) {
      results.push({ date: dateStr, status: "error" });
    }
    current.setDate(current.getDate() + 1);
  }

  const totalImported = results.reduce((sum, r) => sum + (r.imported ?? 0), 0);
  return NextResponse.json({ totalImported, results });
}
