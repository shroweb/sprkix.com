import { prisma } from "@lib/prisma";
import AdminPollsClient from "./AdminPollsClient";

export const dynamic = "force-dynamic";

export default async function AdminPollsPage() {
  const [polls, events] = await Promise.all([
    prisma.poll.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        options: {
          orderBy: { order: "asc" },
          include: { _count: { select: { votes: true } } },
        },
        event: { select: { id: true, title: true, slug: true } },
        _count: { select: { votes: true } },
      },
    }),
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: { id: true, title: true, slug: true, date: true },
      take: 200,
    }),
  ]);

  return <AdminPollsClient initialPolls={polls as any} events={events as any} />;
}
