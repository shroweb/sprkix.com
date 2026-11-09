// components/MatchList.tsx
"use client";

import { useState } from "react";

function secsToMmss(secs: number | null | undefined): string {
  if (!secs) return "?";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
import Link from "next/link";
import BeltImage from "@components/BeltImage";
import StarRating from "./StarRating";
import AddToListButton from "./AddToListButton";
import FaceOff from "./FaceOff";
import { groupSides, inferTeams, cardPosition } from "@lib/match-sides";
import {
  Eye,
  EyeOff,
  Swords,
  Clock,
  Trophy,
  ChevronDown,
  Star,
  Heart,
} from "lucide-react";

export default function MatchList({
  matches,
  user,
  motNMatchId,
  hideSpoilerToggle = false,
  compact = false,
}: {
  matches: any[];
  user: any;
  motNMatchId?: string;
  hideSpoilerToggle?: boolean;
  compact?: boolean;
}) {
  const [showSpoilers, setShowSpoilers] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [favorites, setFavorites] = useState<Record<string, boolean>>(
    Object.fromEntries(matches.map(m => [m.id, m.isFavorited || false]))
  );
  const [isFavoriting, setIsFavoriting] = useState<Record<string, boolean>>({});

  const toggleFavorite = async (matchId: string) => {
    if (!user) return;
    if (isFavoriting[matchId]) return;

    setIsFavoriting(prev => ({ ...prev, [matchId]: true }));
    try {
      const res = await fetch("/api/matches/favorite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(prev => ({ ...prev, [matchId]: data.favorited }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsFavoriting(prev => ({ ...prev, [matchId]: false }));
    }
  };

  return (
    <div className="space-y-6">
      {!hideSpoilerToggle && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => setShowSpoilers((prev) => !prev)}
            className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors pr-2"
          >
            {showSpoilers ? (
              <>
                <EyeOff className="w-4 h-4" /> Hide Results
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Reveal Results
              </>
            )}
          </button>
        </div>
      )}

      {(() => {
        const main = matches[matches.length - 1];
        if (!main || matches.length < 2 || (main.participants?.length ?? 0) < 2) return null;
        const sides = groupSides(inferTeams(main.participants, main.type, main.title));
        const mainIdx = matches.length - 1;
        return (
          <button
            type="button"
            onClick={() => setSelectedIdx(mainIdx)}
            className="group relative block w-full overflow-hidden border border-primary/30 bg-gradient-to-b from-primary/10 to-slate-950/60 p-4 text-left sm:p-6"
          >
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 bg-primary px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary-foreground">
                <Trophy className="h-3 w-3" /> Main Event
              </span>
              <BeltImage type={main.type} title={main.title} height={34} className="shrink-0" />
              <p className="min-w-0 flex-1 truncate text-sm font-black italic uppercase tracking-tight sm:text-base group-hover:text-primary transition-colors">
                {main.title}
              </p>
            </div>
            <FaceOff sides={sides} reveal={showSpoilers} size="lg" className="mx-auto max-w-sm" />
          </button>
        );
      })()}

      <div className="space-y-3">
        {matches.map((match, idx) => {
          const isSelected = idx === selectedIdx;
          const pos = cardPosition(idx, matches.length);
          const firstOfSection = idx === 0 || cardPosition(idx - 1, matches.length) !== pos;
          const sectionLabel = !firstOfSection
            ? null
            : pos === "undercard"
              ? "Undercard"
              : pos === "co-main"
                ? "Co-Main Event"
                : "Main Event";

          // Group participants by team
          const teams: Record<number, typeof match.participants> = {};
          (match.participants || []).forEach((p: any) => {
            const t = p.team ?? 1;
            if (!teams[t]) teams[t] = [];
            teams[t].push(p);
          });
          const teamEntries = Object.entries(teams);

          // Flat list of all participant names for minimized view
          const allParticipants = (match.participants || []).map(
            (p: any) => p.wrestler,
          );

          const isMotN = motNMatchId === match.id;

          const label = sectionLabel ? (
            <p key={`lbl-${match.id}`} className="flex items-center gap-3 pt-3 text-[11px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
              {sectionLabel}
              <span className="h-px flex-1 bg-white/10" />
            </p>
          ) : null;

          if (!isSelected) {
            /* ── Minimized Row ── */
            return (
              <div key={match.id} className="space-y-3">
              {label}
              <button
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left border rounded-2xl px-4 py-3 sm:px-5 sm:py-4 transition-all group overflow-hidden ${isMotN ? "bg-yellow-400/5 border-yellow-400/30 hover:border-yellow-400/50" : "bg-card/85 border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Match number */}
                  <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                    MATCH {idx + 1}
                  </span>
                  {isMotN && (
                    <span className="hidden sm:flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full shrink-0">
                      <Star className="w-2.5 h-2.5 fill-current" /> MOTN
                    </span>
                  )}

                  {/* Type pill — hidden on small screens */}
                  <span className="text-[11px] font-bold uppercase tracking-widest text-primary/60 italic shrink-0 hidden lg:inline truncate max-w-[140px]">
                    {match.type}
                  </span>
                  <BeltImage type={match.type} title={match.title} height={22} className="shrink-0 hidden sm:block" />

                  {/* Title */}
                  <p className="text-xs sm:text-sm font-bold italic uppercase tracking-tight flex-1 group-hover:text-primary transition-colors break-words line-clamp-2 md:line-clamp-none">
                    {match.title}
                  </p>

                  {/* Participants — avatars only, no names */}
                  <div className="hidden md:flex items-center gap-1 shrink-0">
                    {allParticipants.slice(0, 6).map((w: any, i: number) => (
                      <span key={`${w.id}-${i}`} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-[11px] font-bold text-muted-foreground/80">
                            ·
                          </span>
                        )}
                        {w.imageUrl ? (
                          <div
                            className="w-5 h-5 rounded-full overflow-hidden border border-border shrink-0"
                            title={w.name}
                          >
                            <img
                              src={w.imageUrl}
                              alt={w.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div
                            className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[11px] font-bold shrink-0"
                            title={w.name}
                          >
                            {w.name.charAt(0)}
                          </div>
                        )}
                      </span>
                    ))}
                    {allParticipants.length > 6 && (
                      <span className="text-[11px] font-bold text-muted-foreground ml-0.5">
                        +{allParticipants.length - 6}
                      </span>
                    )}
                  </div>

                  <ChevronDown className="w-4 h-4 text-muted-foreground/80 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
              </div>
            );
          }

          /* ── Expanded Card (selected) ── */
          return (
            <div key={match.id} className="space-y-3">
            {label}
            <div className="relative group">
              <div
                className={`absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full transition-colors ${isMotN ? "bg-yellow-400" : "bg-primary"}`}
              />
              <div
                className={`border rounded-[1.5rem] p-6 transition-all overflow-hidden ${isMotN ? "bg-yellow-400/5 border-yellow-400/30" : "bg-card border-primary/20"}`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1 min-w-0">
                    {/* Match number + type */}
                    <div className="flex items-center gap-4 flex-wrap">
                      <span className="text-[11px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        MATCH {idx + 1}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-widest text-primary italic">
                        {match.type}
                      </span>
                      <BeltImage type={match.type} title={match.title} height={36} framed className="shrink-0" />
                      {/title change/i.test(match.result ?? "") && (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2.5 py-1 rounded-full">
                          New champion
                        </span>
                      )}
                      {isMotN && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-current" /> Match of the
                          Night
                        </span>
                      )}
                      {(match.championship || match.title?.toLowerCase().includes("championship") || match.title?.toLowerCase().includes("title")) && (
                        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full">
                          <Trophy className="w-3 h-3 text-amber-400" />
                          {match.championship?.title || "Championship Match"}
                        </span>
                      )}
                    </div>

                    {/* Match title */}
                    <h4 className="text-lg font-black italic uppercase tracking-tight leading-tight">
                      {match.title}
                    </h4>

                    {/* Participants */}
                    {teamEntries.length > 0 && (
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                        {teamEntries.map(([teamNum, participants], tIdx) => (
                          <div
                            key={`team-${teamNum}-${tIdx}`}
                            className="flex flex-wrap items-center gap-1.5"
                          >
                            {tIdx > 0 && (
                              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">
                                vs
                              </span>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5">
                              {(participants as any[]).map(
                                (p: any, pIdx: number) => (
                                  <div
                                    key={`${p.wrestler.id}-${pIdx}`}
                                    className="flex items-center gap-1"
                                  >
                                    {pIdx > 0 && (
                                      <span className="text-[11px] text-muted-foreground">
                                        &amp;
                                      </span>
                                    )}
                                    <div className="flex items-center gap-1.5">
                                      {p.wrestler.imageUrl && (
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-border bg-secondary shrink-0">
                                          <img
                                            src={p.wrestler.imageUrl}
                                            alt={p.wrestler.name}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                      )}
                                      <Link
                                        href={`/wrestlers/${p.wrestler.slug}`}
                                        className="text-sm font-bold hover:text-primary transition-colors"
                                      >
                                        {p.wrestler.name}
                                      </Link>
                                      {showSpoilers && p.isWinner && (
                                        <Trophy className="w-3 h-3 text-primary shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                ),
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Result — blurred until revealed */}
                    {match.result && (
                      <p
                        onClick={() => !showSpoilers && setShowSpoilers(true)}
                        title={!showSpoilers ? "Click to reveal result" : undefined}
                        className={`text-sm font-medium text-muted-foreground border-l-2 border-primary/30 pl-3 transition-all duration-500 ${
                          !showSpoilers
                            ? "blur-md select-none opacity-40 cursor-pointer hover:opacity-70"
                            : "cursor-default"
                        }`}
                      >
                        {match.result}
                      </p>
                    )}

                    {match.duration ? (
                      <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3" />
                          {secsToMmss(match.duration)}
                        </div>
                      </div>
                    ) : null}
                  </div>

                    {!compact && (
                      <div className="flex flex-col items-center gap-3 shrink-0">
                        <div className="bg-secondary/30 px-4 py-3 rounded-2xl flex flex-col items-center justify-center min-w-[130px]">
                          <div className="text-[11px] font-bold text-muted-foreground uppercase mb-2 tracking-widest">
                            Rate Match
                          </div>
                          <StarRating
                            matchId={match.id}
                            initialRating={match.userRating || 0}
                            averageRating={match.averageRating || 0}
                            user={user}
                            showAverage={true}
                            hideStarLabel={true}
                          />
                        </div>

                        {user && (
                          <div className="flex gap-2 w-full">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(match.id);
                              }}
                              disabled={isFavoriting[match.id]}
                              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-[11px] font-bold uppercase tracking-widest transition-all ${
                                favorites[match.id]
                                  ? "bg-red-500/10 border-red-500/30 text-red-500"
                                  : "bg-secondary/30 border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30"
                              }`}
                            >
                              <Heart className={`w-3.5 h-3.5 ${favorites[match.id] ? "fill-current" : ""}`} />
                              {favorites[match.id] ? "Saved" : "Fave"}
                            </button>
                            <AddToListButton matchId={match.id} isLoggedIn={!!user} minimal />
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
