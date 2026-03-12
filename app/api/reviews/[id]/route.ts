import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { rating, comment } = await req.json();

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.userId !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.review.update({
    where: { id },
    data: {
      rating: rating ? parseInt(rating) : review.rating,
      comment: comment ?? review.comment,
    },
  });
  return NextResponse.json({ success: true, review: updated });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getUserFromServerCookie();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the author or an admin can delete
  if (review.userId !== user.id && !user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Delete replies first (cascade not set up for Reply → Review)
  await prisma.reply.deleteMany({ where: { reviewId: id } });
  await prisma.review.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
