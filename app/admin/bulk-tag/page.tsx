import { prisma } from "@lib/prisma";
import BulkTaggerClient from "./BulkTaggerClient";

export default async function BulkTagPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    select: { id: true, title: true, promotion: true, type: true, date: true },
  });

  const serialized = events.map(e => ({ ...e, date: e.date.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Bulk Event Tagger</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Filter → select → assign type to multiple events at once
        </p>
      </div>
      <BulkTaggerClient events={serialized} />
    </div>
  );
}
