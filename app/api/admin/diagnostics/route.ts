import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET() {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const secrets = [
    "JWT_SECRET",
    "CRON_SECRET",
    "DATABASE_URL",
    "DIRECT_URL",
    "RESEND_API_KEY",
    "TMDB_API_KEY",
    "SCRAPER_API_KEY",
    "ADMIN_SETUP_SECRET",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "FACEBOOK_APP_ID",
    "FACEBOOK_APP_SECRET",
    "NEXT_PUBLIC_SITE_URL",
  ];

  const envStatus = secrets.map((key) => ({
    key,
    set: Boolean(process.env[key]),
  }));

  const db = { ok: false, error: null as string | null };
  let counts: Record<string, number> = {};
  try {
    const [users, events, matches, wrestlers, pendingSubmissions] = await Promise.all([
      prisma.user.count(),
      prisma.event.count(),
      prisma.match.count(),
      prisma.wrestler.count(),
      prisma.eventSubmission.count({ where: { status: "pending" } }),
    ]);
    counts = { users, events, matches, wrestlers, pendingSubmissions };
    db.ok = true;
  } catch (err: any) {
    db.error = err.message;
  }

  return NextResponse.json({
    envStatus,
    db,
    counts,
    runtime: typeof process !== "undefined" ? process.versions?.node ?? "worker" : "worker",
  });
}
