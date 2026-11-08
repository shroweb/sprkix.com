import { prisma } from "@lib/prisma";
import LinealAdminClient, { type AdminTitle } from "./LinealAdminClient";

export const dynamic = "force-dynamic";

export default async function AdminLinealPage() {
  let titles: AdminTitle[] = [];
  try {
    const rows = await prisma.linealTitle.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        reigns: {
          orderBy: { startedAt: "desc" },
          include: { wrestler: { select: { name: true, slug: true } } },
        },
      },
    });
    titles = rows.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      emoji: t.emoji,
      description: t.description,
      kind: t.kind,
      isActive: t.isActive,
      allowMultiMan: t.allowMultiMan,
      requireClean: t.requireClean,
      reigns: t.reigns.map((r) => ({
        id: r.id,
        number: r.reignNumber,
        wrestler: r.wrestler.name,
        slug: r.wrestler.slug,
        startedAt: r.startedAt.toISOString(),
        endedAt: r.endedAt?.toISOString() ?? null,
        defences: r.defences,
        source: r.source,
        note: r.note,
      })),
    }));
  } catch (err) {
    console.error("[admin/lineal] load failed", err);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Lineal Titles</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Fan-tracked lineage: the holder only changes when they lose. Recompute re-derives every reign after the seed from match results, and flags matches it can&apos;t decide.
        </p>
      </div>
      <LinealAdminClient initial={titles} />
    </div>
  );
}
