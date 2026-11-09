import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Swords, Target, Calendar } from "lucide-react";
import FaceOff from "@components/FaceOff";
import type { Side } from "@lib/match-sides";

const currentTime = () => Date.now();

export const dynamic = "force-dynamic";

async function load(aSlug: string, bSlug: string) {
  const [a, b] = await Promise.all([
    prisma.wrestler.findUnique({ where: { slug: aSlug }, select: { id: true, name: true, slug: true, imageUrl: true } }),
    prisma.wrestler.findUnique({ where: { slug: bSlug }, select: { id: true, name: true, slug: true, imageUrl: true } }),
  ]);
  if (!a || !b || a.id === b.id) return null;

  const matches = await prisma.match.findMany({
    where: { AND: [{ participants: { some: { wrestlerId: a.id } } }, { participants: { some: { wrestlerId: b.id } } }] },
    select: {
      id: true,
      title: true,
      type: true,
      result: true,
      event: { select: { title: true, slug: true, date: true, startTime: true, enablePredictions: true } },
      participants: { select: { wrestlerId: true, team: true, isWinner: true } },
    },
    orderBy: { event: { date: "desc" } },
    take: 100,
  });
  return { a, b, matches };
}

export async function generateMetadata({ params }: { params: Promise<{ a: string; b: string }> }): Promise<Metadata> {
  const { a, b } = await params;
  const d = await load(a, b);
  if (!d) return {};
  return {
    title: `${d.a.name} vs ${d.b.name} — Rivalry`,
    description: `Head-to-head record, past meetings and prediction for ${d.a.name} vs ${d.b.name}.`,
  };
}

export default async function RivalryPage({ params }: { params: Promise<{ a: string; b: string }> }) {
  const { a: aSlug, b: bSlug } = await params;
  const d = await load(aSlug, bSlug);
  if (!d) return notFound();
  const { a, b, matches } = d;
  const now = currentTime();

  let aWins = 0,
    bWins = 0,
    draws = 0,
    together = 0;
  const past: typeof matches = [];
  let next: (typeof matches)[number] | null = null;

  for (const m of matches) {
    const when = new Date(m.event.startTime ?? m.event.date).getTime();
    if (when > now) {
      if (!next || when < new Date(next.event.startTime ?? next.event.date).getTime()) next = m;
      continue;
    }
    const pa = m.participants.find((p) => p.wrestlerId === a.id)!;
    const pb = m.participants.find((p) => p.wrestlerId === b.id)!;
    const sameSide = pa.team != null && pa.team === pb.team;
    if (sameSide) {
      together++;
      continue;
    }
    past.push(m);
    if (pa.isWinner && !pb.isWinner) aWins++;
    else if (pb.isWinner && !pa.isWinner) bWins++;
    else draws++;
  }

  const total = aWins + bWins + draws;
  const aPct = total ? (aWins / total) * 100 : 50;
  const bPct = total ? (bWins / total) * 100 : 50;
  const sides: Side[] = [a, b].map((w) => ({
    key: w.id,
    team: null,
    isWinner: false,
    members: [{ wrestler: w, team: null, isWinner: false }],
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 pb-20 sm:px-6">
      <Link href={`/wrestlers/${a.slug}`} className="group inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
        <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> {a.name}
      </Link>

      <header className="space-y-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Rivalry</p>
        <h1 className="text-3xl font-black italic uppercase tracking-tighter sm:text-5xl">
          {a.name} <span className="text-muted-foreground">vs</span> {b.name}
        </h1>
        <FaceOff sides={sides} size="lg" className="mx-auto max-w-xl" />
      </header>

      <section className="space-y-3 border border-white/10 bg-card/85 p-5 sm:p-6">
        <div className="flex items-end justify-between text-center">
          <div>
            <p className="text-4xl font-black tabular-nums text-primary">{aWins}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{a.name.split(" ")[0]} wins</p>
          </div>
          <div>
            <p className="text-lg font-black tabular-nums text-muted-foreground">{draws}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Draws / NC</p>
          </div>
          <div>
            <p className="text-4xl font-black tabular-nums text-sky-400">{bWins}</p>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{b.name.split(" ")[0]} wins</p>
          </div>
        </div>
        <div className="flex h-2.5 overflow-hidden bg-white/10">
          <div className="bg-primary" style={{ width: `${aPct}%` }} />
          <div className="bg-sky-400" style={{ width: `${bPct}%` }} />
        </div>
        <p className="text-center text-xs font-bold text-muted-foreground">
          {total} singles/opposing meeting{total === 1 ? "" : "s"}
          {together > 0 ? ` · teamed together ${together}×` : ""}
        </p>
      </section>

      {next && (
        <Link
          href={`/events/${next.event.slug}`}
          className="group flex items-center gap-4 border border-primary/40 bg-primary/10 p-5 transition-colors hover:bg-primary/15"
        >
          <Target className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Next meeting</p>
            <p className="truncate text-lg font-black italic uppercase">{next.event.title}</p>
            <p className="text-xs font-bold text-muted-foreground">
              {new Date(next.event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-primary group-hover:underline">
            {next.event.enablePredictions ? "Who do you pick?" : "View"}
          </span>
        </Link>
      )}

      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
          <Swords className="h-4 w-4" /> Past meetings
        </h2>
        {past.length === 0 ? (
          <p className="border border-dashed border-border p-12 text-center font-bold text-muted-foreground">They haven&apos;t faced each other yet.</p>
        ) : (
          <ul className="divide-y divide-white/5 border border-white/10">
            {past.map((m) => {
              const pa = m.participants.find((p) => p.wrestlerId === a.id)!;
              const pb = m.participants.find((p) => p.wrestlerId === b.id)!;
              const winner = pa.isWinner && !pb.isWinner ? a : pb.isWinner && !pa.isWinner ? b : null;
              return (
                <li key={m.id}>
                  <Link href={`/events/${m.event.slug}`} className="flex items-center gap-4 px-4 py-3 hover:bg-white/[0.03]">
                    <span className="flex w-24 shrink-0 items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(m.event.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black italic uppercase">{m.event.title.replace(/–\s*\d{4}.*$/, "").trim()}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{m.title}</span>
                    </span>
                    <span className={`shrink-0 text-[11px] font-bold uppercase tracking-widest ${winner ? (winner.id === a.id ? "text-primary" : "text-sky-400") : "text-muted-foreground"}`}>
                      {winner ? `${winner.name.split(" ")[0]} won` : "No winner"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
