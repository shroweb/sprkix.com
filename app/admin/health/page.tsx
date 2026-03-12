import { prisma } from "@lib/prisma";
import ImageHealthClient from "./ImageHealthClient";

export default async function ImageHealthPage() {
  const [events, wrestlers] = await Promise.all([
    prisma.event.findMany({
      where: { posterUrl: { not: null } },
      select: { id: true, title: true, posterUrl: true }
    }),
    prisma.wrestler.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, name: true, imageUrl: true }
    })
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Image Health Checker</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Scan {events.length + wrestlers.length} assets for broken links or dead hosts.
        </p>
      </div>
      <ImageHealthClient events={events} wrestlers={wrestlers} />
    </div>
  );
}
