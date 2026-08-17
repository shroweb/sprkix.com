import { prisma } from "@lib/prisma";
import Link from "next/link";
import { ScrollText } from "lucide-react";

export default async function AdminLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ action?: string }>;
}) {
  const { action } = await searchParams;
  const logs = await prisma.adminLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: 300,
    include: {
      actor: { select: { id: true, name: true, slug: true } },
    },
  });

  const actions = Array.from(new Set(logs.map((l) => l.action))).sort();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Admin Log</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Audit trail of destructive or broadcast admin actions.
        </p>
      </div>

      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/logs"
            className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${!action ? "bg-primary border-primary text-black" : "bg-white border-border text-muted-foreground hover:border-primary/30"}`}
          >
            All
          </Link>
          {actions.map((a) => (
            <Link
              key={a}
              href={`/admin/logs?action=${encodeURIComponent(a)}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider border ${action === a ? "bg-primary border-primary text-black" : "bg-white border-border text-muted-foreground hover:border-primary/30"}`}
            >
              {a.replace(/_/g, " ")}
            </Link>
          ))}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {logs.length === 0 ? (
          <div className="py-16 text-center">
            <ScrollText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">No admin actions logged yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((l) => (
              <div key={l.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">
                    <span className="uppercase tracking-wider text-primary">{l.action.replace(/_/g, " ")}</span>
                    {l.detail && <span className="ml-2 text-muted-foreground font-medium text-xs">{l.detail}</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    by {l.actor.name ?? l.actor.slug} · {new Date(l.createdAt).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
