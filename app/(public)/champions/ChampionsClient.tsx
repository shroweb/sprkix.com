"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, Search, Clock, Calendar, Shield, Flame } from "lucide-react";
import PromotionBadge from "@components/PromotionBadge";
import { BeltArt } from "@components/BeltImage";
import { initials } from "@lib/belts";
import { type ChampionRecord, type PromotionCode, getDaysHeld } from "@lib/champions";

const PROMOTIONS: { code: PromotionCode; label: string }[] = [
  { code: "ALL", label: "All Titles" },
  { code: "WWE", label: "WWE" },
  { code: "AEW", label: "AEW" },
  { code: "NXT", label: "NXT" },
  { code: "TNA", label: "TNA" },
  { code: "NJPW", label: "NJPW" },
  { code: "ROH", label: "ROH" },
];

interface Props {
  initialChampions: ChampionRecord[];
}

export default function ChampionsClient({ initialChampions }: Props) {
  const [selectedPromo, setSelectedPromo] = useState<PromotionCode>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const promoCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: initialChampions.length };
    for (const c of initialChampions) {
      counts[c.promotion] = (counts[c.promotion] || 0) + 1;
    }
    return counts;
  }, [initialChampions]);

  const filteredChampions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialChampions.filter((c) => {
      if (selectedPromo !== "ALL" && c.promotion !== selectedPromo) return false;
      if (!q) return true;
      const matchTitle = c.title.toLowerCase().includes(q) || (c.shortName && c.shortName.toLowerCase().includes(q));
      const matchChamp = c.champions.some((p) => p.name.toLowerCase().includes(q));
      const matchEvent = c.wonAt.toLowerCase().includes(q);
      return matchTitle || matchChamp || matchEvent;
    });
  }, [initialChampions, selectedPromo, searchQuery]);

  // Highlights
  const longestReign = useMemo(() => {
    if (!initialChampions.length) return null;
    return [...initialChampions].sort((a, b) => getDaysHeld(b.wonDate) - getDaysHeld(a.wonDate))[0];
  }, [initialChampions]);

  return (
    <div className="space-y-8">
      {/* Quick stats banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mb-1">
            <Trophy className="w-4 h-4" /> Titles Active
          </div>
          <div className="text-2xl sm:text-3xl font-black italic text-white tracking-tight">
            {initialChampions.length}
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across 6 major promotions</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mb-1">
            <Flame className="w-4 h-4" /> Longest Reign
          </div>
          <div className="text-xl sm:text-2xl font-black italic text-white truncate tracking-tight">
            {longestReign ? `${getDaysHeld(longestReign.wonDate).toLocaleString()} days` : "—"}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {longestReign ? `${longestReign.champions.map((p) => p.name).join(" & ")} (${longestReign.shortName || longestReign.promotion})` : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" /> Top Promotions
          </div>
          <div className="text-xl sm:text-2xl font-black italic text-white tracking-tight">
            WWE & AEW
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {(promoCounts["WWE"] || 0) + (promoCounts["AEW"] || 0)} combined titles
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-card/40 p-4 sm:p-5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-primary text-xs font-black uppercase tracking-wider mb-1">
            <Clock className="w-4 h-4" /> Lineage Tracker
          </div>
          <Link
            href="/lineal"
            className="text-xl sm:text-2xl font-black italic text-primary hover:underline tracking-tight block truncate"
          >
            Lineal Titles ↗
          </Link>
          <p className="text-[11px] text-muted-foreground mt-0.5">Explore fan-tracked lineages</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        {/* Promotion Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
          {PROMOTIONS.map((p) => {
            const count = promoCounts[p.code] ?? 0;
            const active = selectedPromo === p.code;
            return (
              <button
                key={p.code}
                onClick={() => setSelectedPromo(p.code)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black uppercase italic tracking-wider transition-all shrink-0 ${
                  active
                    ? "bg-primary text-slate-950 shadow-lg shadow-primary/20 scale-[1.02]"
                    : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span>{p.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                    active ? "bg-slate-950/20 text-slate-950 font-black" : "bg-white/10 text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by championship title, champion name, or event..."
            className="w-full bg-white/[0.04] border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm font-medium text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-white"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Championship Cards Grid */}
      {filteredChampions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-card/20 p-12 text-center space-y-3">
          <Trophy className="w-10 h-10 text-muted-foreground/30 mx-auto" />
          <p className="text-lg font-black italic uppercase text-white tracking-tight">
            No championships matched your search
          </p>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search query or selecting a different promotion filter.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChampions.map((c) => {
            const days = getDaysHeld(c.wonDate);
            const formattedDate = new Date(c.wonDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });

            return (
              <div
                key={c.id}
                className="group relative rounded-3xl border border-white/10 bg-card/40 hover:border-primary/40 hover:bg-card/60 transition-all p-5 flex flex-col justify-between overflow-hidden shadow-lg shadow-black/20"
              >
                <div>
                  {/* Belt artwork plate */}
                  <BeltArt
                    style={c.style}
                    label={initials(c.title)}
                    name={c.title}
                    height={72}
                    framed
                    className="w-full flex items-center justify-center mb-4 py-1"
                  />

                  {/* Header: Promotion + Brand badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <PromotionBadge promotion={c.promotion} />
                    {c.brand && (
                      <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {c.brand}
                      </span>
                    )}
                  </div>

                  {/* Championship title */}
                  <h3 className="text-lg font-black italic uppercase tracking-tight text-white group-hover:text-primary transition-colors leading-tight mb-4">
                    {c.title}
                  </h3>

                  {/* Champions */}
                  <div className="space-y-3 pt-3 border-t border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block">
                      {c.champions.length > 1 ? "Reigning Champions" : "Reigning Champion"}
                    </span>
                    <div className="space-y-2.5">
                      {c.champions.map((champ) => (
                        <div key={champ.name} className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full overflow-hidden border border-white/10 bg-secondary shrink-0 flex items-center justify-center font-black text-muted-foreground text-sm">
                            {champ.imageUrl ? (
                              <Image
                                src={champ.imageUrl}
                                alt={champ.name}
                                width={44}
                                height={44}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <span>{champ.name.charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            {champ.slug ? (
                              <Link
                                href={`/wrestlers/${champ.slug}`}
                                className="font-black italic uppercase tracking-tight text-sm text-white hover:text-primary transition-colors truncate block"
                              >
                                {champ.name}
                              </Link>
                            ) : (
                              <span className="font-black italic uppercase tracking-tight text-sm text-white truncate block">
                                {champ.name}
                              </span>
                            )}
                            <span className="text-[11px] text-muted-foreground block truncate">
                              Champion
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer metadata */}
                <div className="mt-5 pt-3.5 border-t border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-primary font-black text-[11px] uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {days.toLocaleString()} Days Held
                    </span>
                    {typeof c.defenses === "number" && (
                      <span className="text-[10px] font-bold text-slate-300 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {c.defenses} {c.defenses === 1 ? "defense" : "defenses"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-1.5 text-muted-foreground text-[11px]">
                    <Calendar className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground/60" />
                    <span className="truncate">
                      Won at {c.wonAt} · {formattedDate}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
