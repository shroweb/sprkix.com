import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { logAdminAction } from "@lib/admin-log";

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export async function GET(req: Request) {
  const admin = await getUserFromServerCookie();
  if (!admin?.isAdmin)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const kind = searchParams.get("kind") || "users";

  let csv = "";
  let filename = "export.csv";

  switch (kind) {
    case "users": {
      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, name: true, email: true, slug: true, isAdmin: true,
          isVerified: true, isSuspended: true, isFoundingMember: true,
          predictionScore: true, predictionCount: true, createdAt: true,
        },
      });
      csv = toCsv(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
      filename = "users.csv";
      break;
    }
    case "events": {
      const events = await prisma.event.findMany({
        orderBy: { date: "desc" },
        select: {
          id: true, title: true, slug: true, date: true, promotion: true,
          venue: true, city: true, attendance: true, network: true, type: true,
          createdAt: true,
        },
      });
      csv = toCsv(events.map((e) => ({ ...e, date: e.date.toISOString(), createdAt: e.createdAt.toISOString() })));
      filename = "events.csv";
      break;
    }
    case "reviews": {
      const reviews = await prisma.review.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, rating: true, comment: true, userId: true, eventId: true,
          createdAt: true,
        },
      });
      csv = toCsv(reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })));
      filename = "reviews.csv";
      break;
    }
    case "predictions": {
      const predictions = await prisma.prediction.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true, userId: true, matchId: true, predictedWinnerId: true,
          isCorrect: true, createdAt: true,
        },
      });
      csv = toCsv(predictions.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
      filename = "predictions.csv";
      break;
    }
    default:
      return NextResponse.json({ error: "Unknown kind" }, { status: 400 });
  }

  await logAdminAction(admin.id, "export_csv", { detail: kind });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
