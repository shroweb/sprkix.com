import { prisma } from "@lib/prisma";
import BulkMatchParser from "./BulkMatchParser";

export default async function MatchesPage() {
  const events = await prisma.event.findMany({
    take: 20,
    orderBy: { date: 'desc' },
    select: { id: true, title: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Card Drafts</h1>
        <p className="text-muted-foreground text-sm mt-1">Quickly add match cards to recent events.</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-8">
        <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-border shadow-sm">
                <BulkMatchParser eventId={events[0]?.id} />
            </div>
        </div>
        
        <div className="space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Recently Updated</h3>
            {events.map(e => (
                <div key={e.id} className="p-4 bg-white border border-border rounded-2xl hover:border-primary transition-colors cursor-pointer group">
                    <p className="text-xs font-black truncate group-hover:text-primary transition-colors">{e.title}</p>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
