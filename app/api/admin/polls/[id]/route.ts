import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { question, options, isActive } = body as {
    question?: string;
    options?: string[];
    isActive?: boolean;
  };

  // If activating this poll, deactivate all others first
  if (isActive === true) {
    await prisma.poll.updateMany({
      where: { id: { not: id } },
      data: { isActive: false },
    });
  }

  const updateData: any = {};
  if (question !== undefined) updateData.question = question;
  if (isActive !== undefined) updateData.isActive = isActive;

  // If options are provided, delete existing and recreate
  if (options && options.length >= 2) {
    await prisma.pollOption.deleteMany({ where: { pollId: id } });
    updateData.options = {
      create: options.map((text, i) => ({ text, order: i })),
    };
  }

  const poll = await prisma.poll.update({
    where: { id },
    data: updateData,
    include: {
      options: { orderBy: { order: "asc" }, include: { _count: { select: { votes: true } } } },
    },
  });

  return NextResponse.json({ poll });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await prisma.poll.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
