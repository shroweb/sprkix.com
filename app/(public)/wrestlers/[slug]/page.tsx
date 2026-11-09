import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Trophy,
  Calendar,
  Swords,
  TrendingUp,
  UserCircle,
  Star,
  Crown,
} from "lucide-react";
import BioExpand from "./BioExpand";
import UnderlineTabs from "@components/UnderlineTabs";
import { BeltArt } from "@components/BeltImage";
import { getAllCurrentChampions, getDaysHeld } from "@lib/champions";
import { daysBetween } from "@lib/lineal";
import type { Metadata } from "next";
import { getSiteUrl, jsonLdString, breadcrumbLd } from "@lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const wrestler = await prisma.wrestler.findUnique({
    where: { slug },
    select: {
      name: true,
      slug: true,
      imageUrl: true,
      bio: true,
      aliases: { select: { alias: true }, orderBy: { alias: "asc" } },
    },
  });

  if (!wrestler) return {};

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://poisonrana.com";
  const aliases = wrestler.aliases.map((alias) => alias.alias).slice(0, 3).join(", ");
  const description = wrestler.bio?.trim()
    ? wrestler.bio.trim().slice(0, 155)
    : aliases
    ? `${wrestler.name} wrestler profile on Poison Rana. Match history, ratings, stats, and aliases including ${aliases}.`
    : `${wrestler.name} wrestler profile on Poison Rana. Match history, ratings, career stats, and top-rated matches.`;

  return {
    title: `${wrestler.name} Wrestler Profile`,
    description,
    alternates: {
      canonical: `${siteUrl}/wrestlers/${wrestler.slug}`,
    },
    openGraph: {
      title: `${wrestler.name} | Poison Rana`,
      description,
      url: `${siteUrl}/wrestlers/${wrestler.slug}`,
      type: "profile",
      images: wrestler.imageUrl ? [{ url: wrestler.imageUrl }] : undefined,
    },
    twitter: {
      card: wrestler.imageUrl ? "summary_large_image" : "summary",
      title: `${wrestler.name} | Poison Rana`,
      description,
      images: wrestler.imageUrl ? [wrestler.imageUrl] : undefined,
    },
  };
}

export default async function WrestlerPage({ params }: { params: any }) {
  const { slug } = await params;
  const wrestler = await prisma.wrestler.findUnique({
    where: { slug },
    include: {
      aliases: { orderBy: { alias: "asc" } },
      linealReigns: { include: { title: { select: { slug: true, name: true, emoji: true } } }, orderBy: { startedAt: "desc" } },
      matches: {
        include: {
          match: {
            include: {
              event: { select: { id: true, title: true, slug: true, date: true, startTime: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
              participants: { include: { wrestler: true } },
              ratings: { select: { rating: true } },
            },
          },
        },
        orderBy: { match: { event: { date: "desc" } } },
      },
    },
  });

  if (!wrestler) return notFound();

  const now = new Date();
  // Only count matches from events that have already happened.
  // Prefer startTime (actual show time) over date (which may be set to the
  // broadcast date while startTime is the next day).
  const pastMatches = wrestler.matches.filter((mp) => {
    const event = mp.match.event;
    if (event.startTime) return new Date(event.startTime) < now;
    // No startTime: treat the event as still upcoming until end of day
    const endOfDay = new Date(event.date);
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay < now;
  });
  const totalMatches = pastMatches.length;
  const wins = pastMatches.filter((mp) => mp.isWinner).length;
  const losses = totalMatches - wins;
  const winRate =
    totalMatches > 0 ? Math.round((wins / totalMatches) * 100) : 0;
  const uniqueEvents = new Set(pastMatches.map((mp) => mp.match.event.id))
    .size;

  // Current streak — most recent result repeated consecutively
  let currentStreak = 0;
  let streakType: "win" | "loss" | null = null;
  if (pastMatches.length > 0) {
    const byDate = [...pastMatches].sort(
      (a, b) =>
        new Date(b.match.event.startTime ?? b.match.event.date).getTime() -
        new Date(a.match.event.startTime ?? a.match.event.date).getTime(),
    );
    streakType = byDate[0].isWinner ? "win" : "loss";
    for (const mp of byDate) {
      if ((mp.isWinner ? "win" : "loss") === streakType) currentStreak++;
      else break;
    }
  }

  // Head-to-head records against every opponent faced
  const h2h = new Map<
    string,
    {
      wrestler: { name: string; slug: string; imageUrl: string | null };
      wins: number;
      losses: number;
      meets: number;
    }
  >();
  for (const mp of pastMatches) {
    for (const opp of mp.match.participants) {
      if (opp.wrestlerId === wrestler.id) continue;
      const entry =
        h2h.get(opp.wrestlerId) ?? {
          wrestler: {
            name: opp.wrestler.name,
            slug: opp.wrestler.slug,
            imageUrl: opp.wrestler.imageUrl,
          },
          wins: 0,
          losses: 0,
          meets: 0,
        };
      entry.meets++;
      if (mp.isWinner) entry.wins++;
      else entry.losses++;
      h2h.set(opp.wrestlerId, entry);
    }
  }
  const rivals = [...h2h.values()]
    .sort((a, b) => b.meets - a.meets || b.wins - a.wins)
    .slice(0, 5);

  // Compute average match rating this wrestler has appeared in (past only)
  const ratedMatches = pastMatches
    .map((mp) => {
      const ratings = mp.match.ratings;
      if (!ratings.length) return null;
      const avg = ratings.reduce((s, r) => s + r.rating, 0) / ratings.length;
      return { ...mp, avgRating: parseFloat(avg.toFixed(2)) };
    })
    .filter(Boolean) as ((typeof wrestler.matches)[0] & {
    avgRating: number;
  })[];

  const overallAvgRating = ratedMatches.length
    ? parseFloat(
        (
          ratedMatches.reduce((s, m) => s + m.avgRating, 0) /
          ratedMatches.length
        ).toFixed(2),
      )
    : null;

  // Top 3 highest rated matches
  const topMatches = [...ratedMatches]
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 3);

  const siteUrl = getSiteUrl();
  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: wrestler.name,
    url: `${siteUrl}/wrestlers/${wrestler.slug}`,
    image: wrestler.imageUrl?.startsWith("http") ? wrestler.imageUrl : undefined,
    description: wrestler.bio?.trim() ? wrestler.bio.trim().slice(0, 300) : undefined,
    alternateName: wrestler.aliases.length ? wrestler.aliases.map((a) => a.alias) : undefined,
    jobTitle: "Professional wrestler",
  };
  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Wrestlers", path: "/wrestlers" },
    { name: wrestler.name, path: `/wrestlers/${wrestler.slug}` },
  ]);


  // ── Form strip: last 10 results, newest first ─────────────────────────
  const recentByDate = [...pastMatches].sort(
    (a, b) =>
      new Date(b.match.event.startTime ?? b.match.event.date).getTime() -
      new Date(a.match.event.startTime ?? a.match.event.date).getTime(),
  );
  const form = recentByDate.slice(0, 10).map((mp) => {
    const decided = mp.match.participants.some((p) => p.isWinner);
    return { id: mp.match.id, r: !decided ? "D" : mp.isWinner ? "W" : "L", label: mp.match.event.title };
  });

  // ── Titles: current belts (snapshot) + lineal reigns ──────────────────
  const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
  const myName = norm(wrestler.name);
  const heldNow = getAllCurrentChampions().filter((c) => c.champions.some((p) => norm(p.name) === myName));
  const reigns = wrestler.linealReigns;

  // ── Per-year record ───────────────────────────────────────────────────
  const byYear = new Map<number, { w: number; l: number }>();
  for (const mp of pastMatches) {
    const y = new Date(mp.match.event.date).getFullYear();
    const e = byYear.get(y) ?? { w: 0, l: 0 };
    if (mp.isWinner) e.w++;
    else e.l++;
    byYear.set(y, e);
  }
  const years = [...byYear.entries()].sort((a, b) => b[0] - a[0]);
  const allRivals = [...h2h.values()].sort((a, b) => b.meets - a.meets || b.wins - a.wins).slice(0, 15);

  const titlesPanel = (
    <>
      {heldNow.length > 0 && (
        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-400"><Crown className="h-4 w-4" /> Current champion</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {heldNow.map((c) => (
              <Link key={c.id} href="/champions" className="flex items-center gap-4 border border-amber-400/30 bg-amber-400/5 p-4 hover:border-amber-400/60">
                <BeltArt style={c.style} label={c.shortName ?? c.title} name={c.title} height={56} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-black italic uppercase">{c.title}</p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {getDaysHeld(c.wonDate)} days · since {new Date(c.wonDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
      {reigns.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Lineal title timeline</h2>
          <ol className="relative space-y-4 border-l border-white/10 pl-6">
            {reigns.map((r) => {
              const days = daysBetween(new Date(r.startedAt), r.endedAt ? new Date(r.endedAt) : new Date());
              return (
                <li key={r.id} className="relative">
                  <span className={`absolute -left-[30px] top-1.5 h-2.5 w-2.5 ${r.endedAt ? "bg-white/30" : "bg-primary"}`} />
                  <Link href={`/lineal/${r.title.slug}`} className="font-black italic uppercase hover:text-primary">
                    {r.title.emoji ? `${r.title.emoji} ` : ""}{r.title.name} <span className="text-muted-foreground">· reign #{r.reignNumber}</span>
                  </Link>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                    {new Date(r.startedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" })} – {r.endedAt ? new Date(r.endedAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "present"} · {days.toLocaleString()} days
                  </p>
                </li>
              );
            })}
          </ol>
        </section>
      )}
      {heldNow.length === 0 && reigns.length === 0 && (
        <div className="border border-dashed border-border p-16 text-center text-muted-foreground font-bold ">No title history on record yet.</div>
      )}
    </>
  );

  const statsPanel = (
    <>
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Record by year</h2>
        {years.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet.</p>
        ) : (
          <div className="space-y-2">
            {years.map(([y, v]) => {
              const t = v.w + v.l;
              return (
                <div key={y} className="flex items-center gap-3 text-xs font-bold">
                  <span className="w-10 tabular-nums text-muted-foreground">{y}</span>
                  <div className="flex h-3 flex-1 overflow-hidden bg-white/5">
                    <div className="bg-emerald-400" style={{ width: `${(v.w / t) * 100}%` }} />
                    <div className="bg-red-400/70" style={{ width: `${(v.l / t) * 100}%` }} />
                  </div>
                  <span className="w-16 text-right tabular-nums">{v.w}W {v.l}L</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
      <section className="space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Head to head</h2>
        <div className="overflow-hidden border border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03] text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              <tr><th className="px-4 py-2 text-left">Opponent</th><th className="px-4 py-2 text-right">Met</th><th className="px-4 py-2 text-right">W–L</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {allRivals.map((r) => (
                <tr key={r.wrestler.slug} className="hover:bg-white/[0.03]">
                  <td className="px-4 py-2.5"><Link href={`/rivalry/${wrestler.slug}/${r.wrestler.slug}`} className="font-black italic uppercase hover:text-primary">{r.wrestler.name}</Link></td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.meets}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{r.wins}–{r.losses}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );

  const tabs = [
    { id: "overview", label: "Overview", content: (<>
      {/* Top Rated Matches */}
      {topMatches.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
              Top Rated Matches
            </h2>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {topMatches.map((mp, i) => (
              <Link
                key={mp.match.id}
                href={`/events/${mp.match.event.slug}`}
                className="group relative bg-card/85 border border-white/5 hover:border-primary/30 rounded-[2rem] p-8 transition-all space-y-4 overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Trophy className="w-16 h-16 text-primary" />
                </div>
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black italic text-primary">
                      {mp.avgRating.toFixed(2)}
                    </span>
                    <Star className="w-5 h-5 text-primary fill-current" />
                  </div>
                  {mp.isWinner && (
                    <div className="px-3 py-1 bg-emerald-500/10 rounded-full">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Victor</span>
                    </div>
                  )}
                </div>
                <p className="font-black text-lg italic uppercase tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2 relative z-10">
                  {mp.match.title}
                </p>
                <div className="pt-4 border-t border-white/5 relative z-10">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest truncate">
                    {mp.match.event.title.replace(/–\s*\d{4}.*$/, "").trim()}
                    </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Rivalries */}
      {rivals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
              Rivalries
            </h2>
            <div className="flex-1 h-[1px] bg-border" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rivals.map((r) => {
              const h2hRate =
                r.meets > 0 ? Math.round((r.wins / r.meets) * 100) : 0;
              return (
                <Link
                  key={r.wrestler.slug}
                  href={`/rivalry/${wrestler.slug}/${r.wrestler.slug}`}
                  className="group bg-card/85 border border-white/5 hover:border-primary/30 rounded-2xl p-5 transition-all flex items-center gap-4"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-secondary flex items-center justify-center shrink-0">
                    {r.wrestler.imageUrl ? (
                      <Image
                        src={r.wrestler.imageUrl}
                        alt={r.wrestler.name}
                        width={44}
                        height={44}
                        className="object-cover"
                      />
                    ) : (
                      <UserCircle className="w-6 h-6 text-muted-foreground/80" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm uppercase italic tracking-tight truncate group-hover:text-primary transition-colors">
                      {r.wrestler.name}
                    </p>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                      {r.meets} meeting{r.meets === 1 ? "" : "s"} · {r.wins}W / {r.losses}L
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-black italic ${h2hRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                      {h2hRate}%
                    </p>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      vs {wrestler.name.split(" ")[0]}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

    </>) },
    { id: "matches", label: "Matches", count: totalMatches, content: (<>
      {/* Match History */}
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-semibold uppercase italic tracking-tighter">
            Match History
          </h2>
          <div className="flex-1 h-[1px] bg-border" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {totalMatches} Bouts
          </span>
        </div>

        {pastMatches.length > 0 ? (
          <div className="space-y-3">
            {pastMatches.map((mp) => {
              const matchAvgRating = mp.match.ratings.length
                ? parseFloat(
                    (
                      mp.match.ratings.reduce((s, r) => s + r.rating, 0) /
                      mp.match.ratings.length
                    ).toFixed(1),
                  )
                : null;

              // Strip any HTML from the DB value before re-injecting to prevent XSS
              const rawResult = (mp.match.result || "No result recorded").replace(/<[^>]*>/g, "");
              let resultText = rawResult;
              mp.match.participants.forEach(({ wrestler: w }) => {
                const escaped = w.name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
                // Escape wrestler names before injecting into HTML
                const safeName = w.name.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
                resultText = resultText.replace(
                  new RegExp(`\\b${escaped}\\b`, "g"),
                  w.slug === wrestler.slug ? `<strong>${safeName}</strong>` : safeName,
                );
              });

              return (
                <div
                  key={mp.match.id}
                  className={`bg-card/85 border rounded-2xl p-5 flex items-center gap-5 transition-colors hover:bg-card/60 ${mp.isWinner ? "border-emerald-500/20" : "border-white/5"}`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${mp.isWinner ? "bg-emerald-500/10" : "bg-secondary"}`}
                  >
                    {mp.isWinner ? (
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Swords className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-1">
                      <Link
                        href={`/events/${mp.match.event.slug}`}
                        className="font-black text-sm uppercase italic tracking-tight hover:text-primary transition-colors truncate"
                      >
                        {mp.match.event.title
                          .replace(/–\s*\d{4}.*$/, "")
                          .trim()}
                      </Link>
                      {mp.match.title && (
                        <span className="text-[11px] font-bold uppercase tracking-widest bg-secondary px-2 py-0.5 rounded text-muted-foreground shrink-0">
                          {mp.match.title}
                        </span>
                      )}
                    </div>
                    <p
                      className="text-sm text-muted-foreground font-medium "
                      dangerouslySetInnerHTML={{ __html: resultText }}
                    />
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {matchAvgRating && (
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-3 h-3 fill-current" />
                        <span className="text-xs font-bold">
                          {matchAvgRating}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                      <Calendar className="w-3 h-3 text-primary" />
                      {new Date(mp.match.event.date).getFullYear()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card/85 border border-dashed border-border rounded-[2rem] p-20 text-center">
            <TrendingUp className="w-12 h-12 text-muted-foreground/80 mx-auto mb-4" />
            <p className="text-muted-foreground font-bold ">
              No matches logged for this competitor yet.
            </p>
          </div>
        )}
      </div>
    </>) },
    { id: "titles", label: "Titles", count: heldNow.length + reigns.length || undefined, content: titlesPanel },
    { id: "stats", label: "Stats", content: statsPanel },
  ];

  return (
    <div className="space-y-12 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(personLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />
      {/* Hero */}
      <div className="relative rounded-[3rem] overflow-hidden">
        {wrestler.imageUrl && (
          <div className="absolute inset-0 z-0">
            <Image
              src={wrestler.imageUrl}
              alt={wrestler.name}
              fill
              className="object-cover blur-[80px] opacity-20 scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          </div>
        )}
        <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10 p-5 sm:p-8 md:p-10">
          <div className="relative w-40 sm:w-48 md:w-56 aspect-[2/3] rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden shadow-2xl border border-white/10 shrink-0">
            {wrestler.imageUrl ? (
              <Image
                src={wrestler.imageUrl}
                alt={wrestler.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <UserCircle className="w-20 h-20 text-muted-foreground/80" />
              </div>
            )}
          </div>
          <div className="space-y-6 text-center md:text-left flex-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">
                Wrestler Profile
              </p>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-black italic uppercase tracking-tighter leading-none">
                {wrestler.name}
              </h1>
              {wrestler.aliases.length > 0 && (
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  aka{" "}
                  {wrestler.aliases.map((a) => a.alias).join(" · ")}
                </p>
              )}
            </div>

            {/* Career Stats */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black text-emerald-400">{wins}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Wins
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black text-red-400">{losses}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Losses
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black">{totalMatches}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Matches
                </p>
              </div>
              <div className="bg-card/60 backdrop-blur-md border border-white/5 rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center">
                <p className="text-3xl font-black">{uniqueEvents}</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                  Events
                </p>
              </div>
              {currentStreak > 0 && (
                <div className={`bg-card/60 backdrop-blur-md border rounded-2xl px-4 py-3 sm:px-6 sm:py-4 text-center ${streakType === "win" ? "border-emerald-500/20" : "border-red-500/20"}`}>
                  <p className={`text-3xl font-black ${streakType === "win" ? "text-emerald-400" : "text-red-400"}`}>
                    {currentStreak}
                  </p>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    {streakType === "win" ? "🔥 Win Streak" : "Loss Streak"}
                  </p>
                </div>
              )}
              {overallAvgRating && (
                <div className="bg-card/60 backdrop-blur-md border border-primary/20 rounded-2xl px-6 py-4 text-center ring-1 ring-primary/20">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-current" />
                    <p className="text-3xl font-black text-primary">
                      {overallAvgRating}
                    </p>
                  </div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
                    Career Avg
                  </p>
                </div>
              )}
            </div>

            {/* Win rate bar */}
            {totalMatches > 0 && (
              <div className="max-w-xs space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  <span>Win Rate</span>
                  <span className="text-foreground">{winRate}%</span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all"
                    style={{ width: `${winRate}%` }}
                  />
                </div>
              </div>
            )}

            {form.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Last {form.length}</p>
                <div className="flex justify-center gap-1.5 md:justify-start">
                  {form.map((f) => (
                    <span
                      key={f.id}
                      title={f.label}
                      className={`grid h-7 w-7 place-items-center text-[11px] font-bold ${f.r === "W" ? "bg-emerald-500/20 text-emerald-400" : f.r === "L" ? "bg-red-500/20 text-red-400" : "bg-white/10 text-muted-foreground"}`}
                    >
                      {f.r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {wrestler.bio && <BioExpand bio={wrestler.bio} />}
          </div>
        </div>
      </div>

      <UnderlineTabs tabs={tabs} />
    </div>
  );
}
