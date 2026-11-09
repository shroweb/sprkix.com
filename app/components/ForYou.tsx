import Link from "next/link";
import Image from "next/image";
import { prisma } from "@lib/prisma";
import { Sparkles, Calendar } from "lucide-react";

/** Personalised "For you" row: upcoming shows ranked by what this user cares about. */
export default async function ForYou({ userId }: { userId: string }) {
  const now = new Date();
  let rows;
  try {
    const [user, picks, upcoming] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { favoritePromotion: true } }),
      prisma.prediction.findMany({
        where: { userId, predictedWinnerId: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 150,
        select: { predictedWinnerId: true },
      }),
      prisma.event.findMany({
        where: { date: { gte: new Date(now.getTime() - 6 * 3_600_000) } },
        orderBy: { date: "asc" },
        take: 30,
        select: {
          id: true,
          title: true,
          slug: true,
          date: true,
          promotion: true,
          posterUrl: true,
          enablePredictions: true,
          matches: {
            select: {
              id: true,
              participants: { select: { wrestlerId: true, wrestler: { select: { name: true } } } },
              predictions: { where: { userId }, select: { id: true } },
            },
          },
        },
      }),
    ]);

    const loved = new Map<string, number>();
    for (const p of picks) if (p.predictedWinnerId) loved.set(p.predictedWinnerId, (loved.get(p.predictedWinnerId) ?? 0) + 1);
    const fav = user?.favoritePromotion?.toLowerCase();

    rows = upcoming
      .map((e) => {
        const reasons: string[] = [];
        let score = 0;
        if (fav && e.promotion.toLowerCase() === fav) {
          score += 3;
          reasons.push(`You follow ${e.promotion}`);
        }
        let best: { name: string; n: number } | null = null;
        for (const m of e.matches)
          for (const p of m.participants) {
            const n = loved.get(p.wrestlerId);
            if (n && (!best || n > best.n)) best = { name: p.wrestler.name, n };
          }
        if (best) {
          score += 2 + Math.min(best.n, 5) / 5;
          reasons.push(`Features ${best.name}`);
        }
        const open = e.enablePredictions ? e.matches.filter((m) => m.participants.length >= 2 && m.predictions.length === 0).length : 0;
        if (open > 0) {
          score += 1.5;
          reasons.push(`${open} pick${open === 1 ? "" : "s"} open`);
        }
        return { e, score, reasons };
      })
      .filter((r) => r.reasons.length > 0)
      .sort((a, b) => b.score - a.score || a.e.date.getTime() - b.e.date.getTime())
      .slice(0, 4);
  } catch {
    return null;
  }
  if (!rows.length) return null;

  return (
    <section aria-label="For you" className="space-y-4">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-2xl font-black italic uppercase tracking-tighter">For you</h2>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {rows.map(({ e, reasons }) => (
          <Link key={e.id} href={`/events/${e.slug}`} className="group flex gap-3 border border-white/10 bg-card/85 p-3 transition-colors hover:border-primary/40">
            <div className="relative h-24 w-16 shrink-0 overflow-hidden bg-secondary">
              {e.posterUrl ? <Image src={e.posterUrl} alt="" fill sizes="64px" className="object-cover" /> : <Calendar className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground/80" />}
            </div>
            <div className="min-w-0 space-y-1">
              <p className="line-clamp-2 text-sm font-black italic uppercase leading-tight group-hover:text-primary">{e.title}</p>
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                {e.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} · {e.promotion}
              </p>
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{reasons[0]}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
