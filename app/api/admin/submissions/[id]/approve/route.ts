import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const submission = await prisma.eventSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  // Generate unique slug from title
  const baseSlug = submission.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let slug = baseSlug;
  let counter = 2;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  // Create the real event
  const event = await prisma.event.create({
    data: {
      title: submission.title,
      slug,
      date: submission.date,
      promotion: submission.promotion,
      venue: submission.venue,
      city: submission.city,
      attendance: submission.attendance,
      network: submission.network,
      posterUrl: submission.posterUrl,
      description: submission.description,
      type: submission.type,
    },
  });

  // Mark submission as approved
  await prisma.eventSubmission.update({
    where: { id },
    data: { status: "approved", approvedEventId: event.id },
  });

  // Notify the submitter
  await prisma.notification.create({
    data: {
      userId: submission.userId,
      type: "submission_approved",
      message: `Your event submission "${submission.title}" has been approved!`,
      link: `/events/${event.slug}`,
    },
  });

  return NextResponse.json({ success: true, eventId: event.id, slug: event.slug });
}
