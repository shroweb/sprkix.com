import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: NextRequest) {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const {
    title, date, promotion, venue, city, attendance,
    network, posterUrl, description, type, sourceUrl,
  } = await req.json();

  if (!title?.trim()) return NextResponse.json({ error: "Title is required" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "Date is required" }, { status: 400 });
  if (!promotion?.trim()) return NextResponse.json({ error: "Promotion is required" }, { status: 400 });
  if (!sourceUrl?.trim()) return NextResponse.json({ error: "Source URL is required for verification" }, { status: 400 });

  // Rate limit: max 3 pending submissions per user
  const pendingCount = await prisma.eventSubmission.count({
    where: { userId: user.id, status: "pending" },
  });
  if (pendingCount >= 3) {
    return NextResponse.json(
      { error: "You already have 3 pending submissions. Wait for them to be reviewed before submitting more." },
      { status: 429 }
    );
  }

  const submission = await prisma.eventSubmission.create({
    data: {
      userId: user.id,
      title: title.trim(),
      date: new Date(date),
      promotion: promotion.trim(),
      venue: venue?.trim() || null,
      city: city?.trim() || null,
      attendance: attendance ? parseInt(attendance) : null,
      network: network?.trim() || null,
      posterUrl: posterUrl?.trim() || null,
      description: description?.trim() || null,
      type: type?.trim() || null,
      sourceUrl: sourceUrl.trim(),
    },
  });

  return NextResponse.json({ success: true, id: submission.id }, { status: 201 });
}

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await prisma.eventSubmission.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, date: true, promotion: true,
      status: true, rejectionReason: true, approvedEventId: true, createdAt: true,
    },
  });

  return NextResponse.json(submissions);
}
