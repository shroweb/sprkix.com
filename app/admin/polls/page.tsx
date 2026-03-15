import { prisma } from "@lib/prisma";
import AdminPollsClient from "./AdminPollsClient";

export const dynamic = "force-dynamic";

export default async function AdminPollsPage() {
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

  return <AdminPollsClient initialPolls={polls as any} />;
}
