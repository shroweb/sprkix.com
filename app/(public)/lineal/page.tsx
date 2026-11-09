import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Crown, ChevronLeft, Info } from "lucide-react";
import { prisma } from "@lib/prisma";
import { getSiteUrl } from "@lib/seo";
import { daysBetween } from "@lib/lineal";
import { BeltArt } from "@components/BeltImage";
import { initials, styleForName } from "@lib/belts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lineal Championships | Poison Rana",
  description:
    "Who really holds it? Fan-tracked lineal titles, passed on only when the holder is beaten in a singles match.",
  alternates: { canonical: `${getSiteUrl()}/lineal` },
};

async function getData() {
  try {
    const titles = await prisma.linealTitle.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        reigns: {
          orderBy: { startedAt: "desc" },
          include: { wrestler: { select: { id: true, name: true, slug: true, imageUrl: true } } },
        },
      },
    });
    return titles.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      emoji: t.emoji,
      kind: t.kind,
      origin: t.origin,
      changes: Math.max(0, t.reigns.length - 1),
      holder: t.reigns.find((r) => r.endedAt === null) ?? null,
    }));
  } catch (err) {
    // Tables may not exist yet on a fresh database
    console.error("[lineal] index query failed:", err);
    return [];
  }
}

export default async function LinealIndexPage() {
  const titles = await getData();
  const now = new Date();

  // "Omni-holder" board: who holds the most lineal titles right now
  const byHolder = new Map<string, { name: string; slug: string; imageUrl: string | null; count: number }>();
  for (const t of titles) {
    if (!t.holder) continue;
    const w = t.holder.wrestler;
    const entry = byHolder.get(w.id) ?? { name: w.name, slug: w.slug, imageUrl: w.imageUrl, count: 0 };
    entry.count++;
    byHolder.set(w.id, entry);
  }
  const board = [...byHolder.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary ">Fan-tracked</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
          Lineal<br />Championships
        </h1>
        <p className="text-muted-foreground font-medium max-w-2xl">
          The man who beat the man. A lineal title only changes hands when the holder loses a clean singles match,
          in any promotion, whatever belt was on the line.
        </p>
        <p className="flex items-start gap-2 text-xs text-muted-foreground/70 max-w-2xl">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Unofficial and just for fun. No promotion recognises these lineages.
        </p>
      </header>

      {titles.length === 0 ? (
        <div className="bg-card/85 border border-dashed border-white/10 rounded-[2.5rem] p-8 sm:p-16 text-center">
          <Crown className="w-14 h-14 text-white/10 mx-auto mb-4" />
          <p className="text-white/75 font-black italic text-xl uppercase tracking-tighter">No lineal titles yet</p>
          <p className="text-muted-foreground text-sm mt-2">Check back soon.</p>
        </div>
      ) : (
        <>
          {board.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-primary ">Holding the most right now</h2>
              <div className="flex flex-wrap gap-3">
                {board.map((h, i) => (
                  <Link
                    key={h.slug}
                    href={`/wrestlers/${h.slug}`}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors hover:border-primary/40 ${
                      i === 0 ? "border-primary/30 bg-primary/10" : "border-white/10 bg-card/85"
                    }`}
                  >
                    <span className="text-2xl font-black italic text-primary leading-none">{h.count}</span>
                    <span className="font-bold uppercase tracking-tight text-sm">{h.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 sm:grid-cols-2">
            {titles.map((t) => (
              <Link
                key={t.id}
                href={`/lineal/${t.slug}`}
                className="group rounded-3xl border border-white/10 bg-card/85 p-6 hover:border-primary/40 hover:bg-card/60 transition-all"
              >
                <BeltArt style={styleForName(t.name)} label={initials(t.name)} name={t.name} height={64} framed className="mb-4" />
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-lg font-black italic uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
                    {t.name}
                  </h3>
                  {t.kind === "novelty" && (
                    <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-primary border border-primary/30 rounded-full px-2 py-0.5">
                      Novelty
                    </span>
                  )}
                </div>

                {t.holder ? (
                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-white/10 bg-secondary shrink-0 flex items-center justify-center font-black text-muted-foreground">
                      {t.holder.wrestler.imageUrl ? (
                        <Image src={t.holder.wrestler.imageUrl} alt={t.holder.wrestler.name} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        t.holder.wrestler.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Lineal holder</p>
                      <p className="font-black italic uppercase tracking-tight truncate">{t.holder.wrestler.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {daysBetween(t.holder.startedAt, now)} days · {t.changes} title change{t.changes === 1 ? "" : "s"} tracked
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="mt-5 text-sm text-muted-foreground">No current holder</p>
                )}
              </Link>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
