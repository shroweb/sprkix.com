import Link from "next/link";
import type { Metadata } from "next";
import { ChevronLeft, Trophy } from "lucide-react";
import { prisma } from "@lib/prisma";
import { getSiteUrl, jsonLdString, breadcrumbLd } from "@lib/seo";
import { getAllCurrentChampions, CHAMPIONS_AS_OF, type ChampionRecord } from "@lib/champions";
import ChampionsClient from "./ChampionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Current Champions",
  description:
    "Track all active professional wrestling champions across WWE, AEW, NXT, TNA, NJPW, and ROH. Real title belts, reign lengths, and championship history.",
  alternates: { canonical: `${getSiteUrl()}/champions` },
};

async function getEnrichedChampions(): Promise<ChampionRecord[]> {
  const base = getAllCurrentChampions();

  // Collect all champion names / slugs to look up existing database wrestler records
  const names = new Set<string>();
  const slugs = new Set<string>();
  for (const c of base) {
    for (const p of c.champions) {
      names.add(p.name);
      if (p.slug) slugs.add(p.slug);
    }
  }

  let dbWrestlers: { id: string; name: string; slug: string; imageUrl: string | null }[] = [];
  try {
    dbWrestlers = await prisma.wrestler.findMany({
      where: {
        OR: [
          { slug: { in: Array.from(slugs) } },
          { name: { in: Array.from(names) } },
          ...Array.from(names).map((n) => ({ name: { equals: n, mode: "insensitive" as const } })),
        ],
      },
      select: { id: true, name: true, slug: true, imageUrl: true },
    });
  } catch (err) {
    console.error("Failed to query wrestlers for champions page:", err);
  }

  const norm = (v: string) =>
    v.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/["'“”‘’.]/g, "").toLowerCase().trim();
  const bySlug = new Map(dbWrestlers.map((w) => [w.slug.toLowerCase(), w]));
  const byName = new Map(dbWrestlers.map((w) => [norm(w.name), w]));

  // Enrich each champion with live database photo and verified slug
  return base.map((record) => ({
    ...record,
    champions: record.champions.map((p) => {
      const match =
        (p.slug && bySlug.get(p.slug.toLowerCase())) ||
        byName.get(norm(p.name));
      return {
        name: p.name,
        slug: match ? match.slug : p.slug,
        imageUrl: match?.imageUrl || p.imageUrl || null,
      };
    }),
  }));
}

export default async function ChampionsPage() {
  const champions = await getEnrichedChampions();

  const breadcrumbs = breadcrumbLd([
    { name: "Home", path: "/" },
    { name: "Current Champions", path: "/champions" },
  ]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(breadcrumbs) }}
      />

      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-bold uppercase tracking-wider text-primary ">
            Title Belts & Honours
          </span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
              Current<br />Champions
            </h1>
            <p className="text-muted-foreground font-medium max-w-2xl text-sm sm:text-base">
              The reigning gold across world professional wrestling: WWE, AEW, NXT, TNA, NJPW, and ROH.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground/80 self-start sm:self-auto bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5">
            <Trophy className="w-4 h-4 text-primary" />
            <span>
              {champions.length} Titles · updated{" "}
              {new Date(CHAMPIONS_AS_OF + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
        </div>
      </header>

      {/* Interactive client component with filter tabs, search, and cards */}
      <ChampionsClient initialChampions={champions} />
    </div>
  );
}
