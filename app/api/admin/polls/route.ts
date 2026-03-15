import { NextResponse } from "next/server";
import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";

export async function GET() {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const polls = await prisma.poll.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      options: {
        orderBy: { order: "asc" },
        include: { _count: { select: { votes: true } } },
      },
      _count: { select: { votes: true } },
    },
  });

  return NextResponse.json({ polls });
}

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { question, options, isActive } = body as {
    question: string;
    options: string[];
    isActive: boolean;
  };

  if (!question || !options || options.length < 2) {
    return NextResponse.json(
      { error: "Question and at least 2 options are required" },
      { status: 400 }
    );
  }

  // If activating this poll, deactivate all others first
  if (isActive) {
    await prisma.poll.updateMany({ data: { isActive: false } });
  }

  const poll = await prisma.poll.create({
    data: {
      question,
      isActive: !!isActive,
      options: {
        create: options.map((text, i) => ({ text, order: i })),
      },
    },
    include: {
      options: { orderBy: { order: "asc" }, include: { _count: { select: { votes: true } } } },
    },
  });

  return NextResponse.json({ poll });
}
