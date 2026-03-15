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
import StarRating from "./StarRating";
import AddToListButton from "./AddToListButton";
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
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-colors pr-2"
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

      <div className="space-y-3">
        {matches.map((match, idx) => {
          const isSelected = idx === selectedIdx;

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

          if (!isSelected) {
            /* ── Minimized Row ── */
            return (
              <button
                key={match.id}
                type="button"
                onClick={() => setSelectedIdx(idx)}
                className={`w-full text-left border rounded-2xl px-4 py-3 sm:px-5 sm:py-4 transition-all group overflow-hidden ${isMotN ? "bg-yellow-400/5 border-yellow-400/30 hover:border-yellow-400/50" : "bg-card/40 border-border hover:border-primary/30"}`}
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  {/* Match number */}
                  <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded shrink-0">
                    MATCH {idx + 1}
                  </span>
                  {isMotN && (
                    <span className="hidden sm:flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-full shrink-0">
                      <Star className="w-2.5 h-2.5 fill-current" /> MOTN
                    </span>
                  )}

                  {/* Type pill — hidden on small screens */}
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary/60 italic shrink-0 hidden lg:inline truncate max-w-[140px]">
                    {match.type}
                  </span>

                  {/* Title */}
                  <p className="text-xs sm:text-sm font-black italic uppercase tracking-tight flex-1 group-hover:text-primary transition-colors break-words line-clamp-2 md:line-clamp-none">
                    {match.title}
                  </p>

                  {/* Participants — avatars only, no names */}
                  <div className="hidden md:flex items-center gap-1 shrink-0">
                    {allParticipants.slice(0, 6).map((w: any, i: number) => (
                      <span key={`${w.id}-${i}`} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-[8px] font-black text-muted-foreground/40">
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
                            className="w-5 h-5 rounded-full bg-secondary border border-border flex items-center justify-center text-[8px] font-black shrink-0"
                            title={w.name}
                          >
                            {w.name.charAt(0)}
                          </div>
                        )}
                      </span>
                    ))}
                    {allParticipants.length > 6 && (
                      <span className="text-[10px] font-bold text-muted-foreground ml-0.5">
                        +{allParticipants.length - 6}
                      </span>
                    )}
                  </div>

                  <ChevronDown className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                </div>
              </button>
            );
          }

          /* ── Expanded Card (selected) ── */
          return (
            <div key={match.id} className="relative group">
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
                      <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                        MATCH {idx + 1}
                      </span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                        {match.type}
                      </span>
                      {isMotN && (
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-yellow-400 bg-yellow-400/10 border border-yellow-400/20 px-2.5 py-1 rounded-full">
                          <Star className="w-3 h-3 fill-current" /> Match of the
                          Night
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
                              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
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
                                      <span className="text-[10px] text-muted-foreground">
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
                        className={`text-sm font-medium italic text-muted-foreground border-l-2 border-primary/30 pl-3 transition-all duration-500 ${!showSpoilers ? "blur-md select-none opacity-30" : ""}`}
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
                      <div className="flex flex-col items-center gap-4">
                        <div className="bg-secondary/30 p-4 rounded-2xl flex flex-col items-center justify-center min-w-[120px]">
                          <div className="text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest">
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(match.id);
                            }}
                            disabled={isFavoriting[match.id]}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${
                              favorites[match.id]
                                ? "bg-red-500/10 border-red-500/30 text-red-500"
                                : "bg-secondary/30 border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${favorites[match.id] ? "fill-current" : ""}`} />
                            <span className="text-[10px] font-black uppercase tracking-widest">
                              {favorites[match.id] ? "Favourited" : "Favourite"}
                            </span>
                          </button>
                        )}
                        <AddToListButton matchId={match.id} isLoggedIn={!!user} minimal />
                      </div>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
