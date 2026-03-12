import { prisma } from "@lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getUserFromServerCookie } from "@lib/server-auth";
import ResultsClient from "./ResultsClient";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function BulkResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserFromServerCookie();
  if (!user?.isAdmin) redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      matches: {
        include: {
          participants: {
            include: {
              wrestler: { select: { id: true, name: true, imageUrl: true } },
            },
            orderBy: { team: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!event) return notFound();

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <Link
          href={`/admin/events/${id}/edit`}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-4 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Edit Event
        </Link>
        <h1 className="text-3xl font-black tracking-tight uppercase italic">
          {event.title}
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Quick Results Entry — set match winners in one go.
        </p>
      </div>

      <ResultsClient event={event} />
    </div>
  );
}
