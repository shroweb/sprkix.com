import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChevronLeft, Crown, Info, Swords } from "lucide-react";
import { prisma } from "@lib/prisma";
import { getSiteUrl, jsonLdString, breadcrumbLd } from "@lib/seo";
import { daysBetween } from "@lib/lineal";
import { BeltArt } from "@components/BeltImage";
import { initials, styleForName } from "@lib/belts";

export const dynamic = "force-dynamic";

async function getTitle(slug: string) {
  try {
    return await prisma.linealTitle.findUnique({
      where: { slug },
      include: {
        reigns: {
          orderBy: { startedAt: "desc" },
          include: { wrestler: { select: { id: true, name: true, slug: true, imageUrl: true } } },
        },
      },
    });
  } catch (err) {
    console.error("[lineal] title query failed:", err);
    return null;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const title = await getTitle(slug);
  if (!title) return {};
  const holder = title.reigns.find((r) => r.endedAt === null)?.wrestler.name;
  const description = holder
    ? `${holder} is the lineal holder of the ${title.name}. See every reign and how it changed hands.`
    : `The lineal history of the ${title.name}.`;
  return {
    title: `Lineal ${title.name}`,
    description,
    alternates: { canonical: `${getSiteUrl()}/lineal/${title.slug}` },
    openGraph: { title: `Lineal ${title.name}`, description, type: "website" },
  };
}

const fmt = (d: Date) => d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" });

export default async function LinealTitlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const title = await getTitle(slug);
  if (!title || !title.isActive) return notFound();

  const now = new Date();
  const current = title.reigns.find((r) => r.endedAt === null) ?? null;

  // Resolve the matches that started/ended reigns so each row can say "beat X at Y"
  const matchIds = [...new Set(title.reigns.flatMap((r) => [r.startMatchId, r.endMatchId]).filter((x): x is string => !!x))];
  const matches = matchIds.length
    ? await prisma.match.findMany({
        where: { id: { in: matchIds } },
        select: {
          id: true,
          event: { select: { title: true, slug: true } },
          participants: { select: { wrestlerId: true, isWinner: true, wrestler: { select: { name: true } } } },
        },
      })
    : [];
  const matchById = new Map(matches.map((m) => [m.id, m]));

  const beatenBy = (r: (typeof title.reigns)[number]) => {
    if (!r.startMatchId) return null;
    const m = matchById.get(r.startMatchId);
    if (!m) return null;
    const loser = m.participants.find((p) => p.isWinner !== true && p.wrestlerId !== r.wrestlerId);
    return { loser: loser?.wrestler.name ?? null, event: m.event };
  };

  // ── Records + timeline ────────────────────────────────────────────────
  const reignDays = (r: (typeof title.reigns)[number]) => daysBetween(r.startedAt, r.endedAt ?? now);
  const chronological = [...title.reigns].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime());
  const totalDays = chronological.reduce((a, r) => a + reignDays(r), 0) || 1;
  const longest = [...title.reigns].sort((a, b) => reignDays(b) - reignDays(a))[0];
  const shortest = [...title.reigns].filter((r) => r.endedAt).sort((a, b) => reignDays(a) - reignDays(b))[0];
  const mostDefences = [...title.reigns].sort((a, b) => b.defences - a.defences)[0];
  const perHolder = new Map<string, { name: string; slug: string; reigns: number; days: number }>();
  for (const r of title.reigns) {
    const e = perHolder.get(r.wrestlerId) ?? { name: r.wrestler.name, slug: r.wrestler.slug, reigns: 0, days: 0 };
    e.reigns += 1;
    e.days += reignDays(r);
    perHolder.set(r.wrestlerId, e);
  }
  const holders = [...perHolder.values()];
  const mostReigns = [...holders].sort((a, b) => b.reigns - a.reigns || b.days - a.days)[0];
  const mostDays = [...holders].sort((a, b) => b.days - a.days)[0];
  const hue = (id: string) => {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
    return h;
  };
  const records = [
    longest && { k: "Longest reign", v: `${reignDays(longest).toLocaleString()} days`, who: longest.wrestler.name, slug: longest.wrestler.slug },
    mostReigns && { k: "Most reigns", v: `${mostReigns.reigns}`, who: mostReigns.name, slug: mostReigns.slug },
    mostDays && { k: "Most days combined", v: `${mostDays.days.toLocaleString()} days`, who: mostDays.name, slug: mostDays.slug },
    shortest && { k: "Shortest reign", v: `${reignDays(shortest)} day${reignDays(shortest) === 1 ? "" : "s"}`, who: shortest.wrestler.name, slug: shortest.wrestler.slug },
    mostDefences && mostDefences.defences > 0 && { k: "Most defences", v: `${mostDefences.defences}`, who: mostDefences.wrestler.name, slug: mostDefences.wrestler.slug },
  ].filter(Boolean) as { k: string; v: string; who: string; slug: string }[];

  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Lineal Championships", path: "/lineal" },
    { name: title.name, path: `/lineal/${title.slug}` },
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }} />

      <Link href="/lineal" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group">
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        All lineal titles
      </Link>

      <header className="space-y-3">
        <BeltArt style={styleForName(title.name)} label={initials(title.name)} name={title.name} height={96} framed className="mb-2" />
        <p className="text-xs font-bold uppercase tracking-wider text-primary ">
          {title.kind === "novelty" ? "Lineal novelty prize" : "Lineal championship"}
        </p>
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic leading-[0.95]">
          {title.name}
        </h1>
        {title.origin && <p className="text-muted-foreground font-medium max-w-2xl">{title.origin}</p>}
      </header>

      {current && (
        <section className="rounded-3xl border border-primary/30 bg-primary/10 p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-primary/40 bg-secondary shrink-0 flex items-center justify-center text-2xl font-black">
            {current.wrestler.imageUrl ? (
              <Image src={current.wrestler.imageUrl} alt={current.wrestler.name} width={80} height={80} className="object-cover w-full h-full" />
            ) : (
              current.wrestler.name.charAt(0)
            )}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" /> Current lineal holder
            </p>
            <Link href={`/wrestlers/${current.wrestler.slug}`} className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight hover:text-primary transition-colors">
              {current.wrestler.name}
            </Link>
            <p className="text-sm text-muted-foreground mt-1">
              {daysBetween(current.startedAt, now)} days · {current.defences} defence{current.defences === 1 ? "" : "s"} since {fmt(current.startedAt)}
            </p>
          </div>
        </section>
      )}

      {title.reigns.length > 1 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary ">Records</h2>
          <div className="grid grid-cols-2 gap-px bg-white/10 sm:grid-cols-3">
            {records.map((r) => (
              <div key={r.k} className="bg-slate-950 p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{r.k}</p>
                <p className="text-2xl font-black tabular-nums">{r.v}</p>
                <Link href={`/wrestlers/${r.slug}`} className="block truncate text-xs font-bold uppercase text-primary hover:underline">{r.who}</Link>
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Timeline · width = days held</p>
            <div className="flex h-8 w-full gap-px overflow-hidden bg-white/5" role="img" aria-label="Reign lengths over time">
              {chronological.map((r) => (
                <Link
                  key={r.id}
                  href={`/wrestlers/${r.wrestler.slug}`}
                  title={`${r.wrestler.name} · ${reignDays(r)} days`}
                  className="relative min-w-[3px] transition-opacity hover:opacity-80"
                  style={{ flexGrow: reignDays(r) / totalDays, flexBasis: 0, background: `hsl(${hue(r.wrestlerId)} 55% ${r.endedAt ? 45 : 60}%)` }}
                >
                  {!r.endedAt && <span className="pr-live-dot absolute right-1 top-1 h-1.5 w-1.5 bg-white" />}
                </Link>
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] font-bold tabular-nums text-muted-foreground">
              <span>{chronological[0]?.startedAt.getUTCFullYear()}</span>
              <span>{now.getUTCFullYear()}</span>
            </div>
          </div>
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-primary ">Reign history</h2>
        <ol className="space-y-3">
          {title.reigns.map((r) => {
            const via = beatenBy(r);
            return (
              <li key={r.id} className="rounded-2xl border border-white/10 bg-card/85 p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/wrestlers/${r.wrestler.slug}`} className="font-black italic uppercase tracking-tight text-lg hover:text-primary transition-colors">
                    {r.wrestler.name}
                    {r.reignNumber > 1 && <span className="ml-1 text-muted-foreground font-bold not-italic">({r.reignNumber})</span>}
                  </Link>
                  <span className="text-xs font-bold text-muted-foreground">
                    {fmt(r.startedAt)} – {r.endedAt ? fmt(r.endedAt) : "present"} · {daysBetween(r.startedAt, r.endedAt ?? now)} days
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5 shrink-0" />
                  {via ? (
                    <>
                      {via.loser ? <>Beat {via.loser} at </> : <>Won at </>}
                      <Link href={`/events/${via.event.slug}`} className="underline underline-offset-2 hover:text-primary">{via.event.title}</Link>
                    </>
                  ) : (
                    r.note ?? "Starting point"
                  )}
                  {r.defences > 0 && <> · {r.defences} defence{r.defences === 1 ? "" : "s"}</>}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="rounded-2xl border border-white/10 bg-card/85 p-5 space-y-2 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-bold uppercase tracking-wider text-[11px] text-foreground">
          <Info className="w-3.5 h-3.5" /> How this works
        </p>
        <p>
          The holder only changes when they lose a clean 1-on-1 match. Tag matches, battle royals and Royal Rumbles don&apos;t
          count{title.allowMultiMan ? ", but triple threats, fatal 4-ways and other single-winner multi-man matches do" : ""}. DQs, count-outs and
          no-contests don&apos;t count either. It follows the holder across every promotion we track.
        </p>
        <p>Fan-tracked and unofficial. Tracked from the starting point above using results on Poison Rana.</p>
      </section>
    </div>
  );
}
