import { prisma } from "../../../../../lib/prisma";
import { notFound } from "next/navigation";
import EditEventClient from "./EditEventClient";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEventPage({ params }: PageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true, title: true, slug: true, date: true, promotion: true,
      venue: true, posterUrl: true, description: true, type: true,
      tmdbId: true, profightdbUrl: true, startTime: true, endTime: true,
      currentMatchOrder: true, createdAt: true,
    },
  });
  if (!event) return notFound();

  const matches = await prisma.match.findMany({
    where: { eventId: event.id },
    include: {
      participants: {
        include: { wrestler: true },
        orderBy: { team: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // We only need id, name, and imageUrl for the combobox
  const wrestlers = await prisma.wrestler.findMany({
    select: { id: true, name: true, imageUrl: true },
    orderBy: { name: "asc" },
  });

  return (
    <EditEventClient
      event={event}
      initialMatches={matches}
      wrestlers={wrestlers}
    />
  );
}
