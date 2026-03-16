import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { reason } = await req.json();

  const submission = await prisma.eventSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (submission.status !== "pending") return NextResponse.json({ error: "Already reviewed" }, { status: 400 });

  await prisma.eventSubmission.update({
    where: { id },
    data: { status: "rejected", rejectionReason: reason?.trim() || null },
  });

  // Notify the submitter
  await prisma.notification.create({
    data: {
      userId: submission.userId,
      type: "submission_rejected",
      message: `Your event submission "${submission.title}" was not approved.`,
      detail: reason?.trim() || null,
      link: `/submit-event`,
    },
  });

  return NextResponse.json({ success: true });
}
