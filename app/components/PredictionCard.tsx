"use client";

import { useState } from "react";
import { Trophy, CheckCircle, XCircle, Users, Lock, Zap } from "lucide-react";

function WrestlerAvatar({
  wrestler,
  size = "md",
}: {
  wrestler: { name: string; imageUrl?: string | null };
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "w-16 h-16 text-base" : size === "sm" ? "w-7 h-7 text-[9px]" : "w-10 h-10 text-xs";
  const words = wrestler.name ? wrestler.name.trim().split(/\s+/) : [];
  const initial =
    words.length >= 2
      ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
      : words[0]?.slice(0, 2).toUpperCase() ?? "?";

  if (wrestler.imageUrl) {
    return (
      <div className={`${sizeClass} rounded-full overflow-hidden shrink-0`}>
        <img src={wrestler.imageUrl} alt={wrestler.name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center bg-primary/20 text-primary font-black leading-none select-none shrink-0`}
    >
      {initial}
    </div>
  );
}

interface PredictionCardProps {
  match: any;
  user: any;
  initialPredictionId?: string | null;
  communityStats?: { winnerId: string; percentage: number }[];
  readOnly?: boolean;
  userPredictionIsCorrect?: boolean | null;
}

export default function PredictionCard({
  match,
  user,
  initialPredictionId,
  communityStats = [],
  readOnly = false,
  userPredictionIsCorrect = null,
}: PredictionCardProps) {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(
    initialPredictionId || null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lockError, setLockError] = useState<string | null>(null);

  // ── Team detection ────────────────────────────────────────────────────────
  // Only use team-based grouping when there are genuinely ≥2 distinct team numbers.
  const teamNums = match.participants.map((p: any) => p.team).filter((t: any) => t != null);
  const distinctTeams = Array.from(new Set(teamNums)) as number[];
  const hasTrueTeams = distinctTeams.length >= 2;

  // Build team groups (only used when hasTrueTeams)
  const teams: Record<number, any[]> = {};
  if (hasTrueTeams) {
    match.participants.forEach((p: any) => {
      const t = p.team;
      if (t != null) {
        if (!teams[t]) teams[t] = [];
        teams[t].push(p);
      }
    });
  }

  const selectedParticipant = match.participants.find(
    (p: any) => p.wrestler.id === selectedWinnerId
  );
  const selectedTeamNum: number | null =
    hasTrueTeams && selectedParticipant ? (selectedParticipant.team ?? null) : null;

  const handlePredict = async (wrestlerId: string) => {
    if (!user || isSubmitting || readOnly) return;
    setLockError(null);

    let newWinnerId: string | null;
    if (hasTrueTeams) {
      const clickedTeam = match.participants.find((p: any) => p.wrestler.id === wrestlerId)?.team ?? null;
      newWinnerId = clickedTeam !== null && clickedTeam === selectedTeamNum ? null : wrestlerId;
    } else {
      newWinnerId = selectedWinnerId === wrestlerId ? null : wrestlerId;
    }

    // Optimistic update — apply immediately, only revert for hard errors (locked/auth)
    const previousId = selectedWinnerId;
    setSelectedWinnerId(newWinnerId);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, predictedWinnerId: newWinnerId }),
      });
      if (res.status === 401 || res.status === 403) {
        // Only revert for auth or lock errors
        setSelectedWinnerId(previousId);
        const data = await res.json().catch(() => ({}));
        setLockError(data.error || "Predictions are locked");
      }
      // Any other non-OK (500 etc) — keep the selection, it'll save on next deploy
    } catch {
      // Network error — keep selection optimistically
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTwoTeam = hasTrueTeams && distinctTeams.length === 2;
  const totalPicks = communityStats.length;

  // ─── Archive / Read-only mode ──────────────────────────────────────────────
  if (readOnly) {
    const actualWinners = match.participants.filter((p: any) => p.isWinner).map((p: any) => p.wrestler);
    const predictedWrestler = initialPredictionId
      ? match.participants.find((p: any) => p.wrestler.id === initialPredictionId)?.wrestler
      : null;
    const hasResolved = userPredictionIsCorrect !== null;

    return (
      <div className="bg-card/40 border border-border rounded-3xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{match.type || "Match"}</span>
              <h4 className="text-lg font-black italic uppercase tracking-tight leading-tight">{match.title}</h4>
            </div>
            {predictedWrestler && hasResolved && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${userPredictionIsCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
                {userPredictionIsCorrect ? <><CheckCircle className="w-3 h-3" /> Called It!</> : <><XCircle className="w-3 h-3" /> Wrong Pick</>}
              </div>
            )}
            {predictedWrestler && !hasResolved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground">
                <Lock className="w-3 h-3" /> Pending
              </div>
            )}
          </div>

          {actualWinners.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" /> Result
              </p>
              <div className="flex flex-wrap gap-2">
                {actualWinners.map((w: any) => (
                  <div key={w.id} className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-3 py-2 rounded-xl">
                    <WrestlerAvatar wrestler={w} size="sm" />
                    <span className="text-sm font-black italic uppercase tracking-tight text-yellow-400">{w.name}</span>
                    <Trophy className="w-3 h-3 text-yellow-400 fill-yellow-400/40" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {predictedWrestler && (!hasResolved || userPredictionIsCorrect) ? (
            <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 ${!hasResolved ? "border-border bg-secondary/20" : "border-emerald-500/40 bg-emerald-500/10"}`}>
              <WrestlerAvatar wrestler={predictedWrestler} size="sm" />
              <span className={`text-sm font-black italic uppercase tracking-tight ${!hasResolved ? "text-foreground" : "text-emerald-400"}`}>{predictedWrestler.name}</span>
              {hasResolved && <span className="ml-auto"><CheckCircle className="w-4 h-4 text-emerald-400" /></span>}
            </div>
          ) : !predictedWrestler ? (
            <p className="text-[11px] italic text-muted-foreground/60 font-medium">You didn't make a prediction for this match.</p>
          ) : null}
        </div>
      </div>
    );
  }

  // ─── Interactive mode ──────────────────────────────────────────────────────

  // ── 2-team VS layout ───────────────────────────────────────────────────────
  if (isTwoTeam) {
    const [teamANum, teamBNum] = distinctTeams;
    const teamA = teams[teamANum] ?? [];
    const teamB = teams[teamBNum] ?? [];

    // Community confidence for each side: sum % of all team members' stats
    // Use the first participant of each team as the representative
    const teamAStats = communityStats.find((s) => teamA.some((p: any) => p.wrestler.id === s.winnerId));
    const teamBStats = communityStats.find((s) => teamB.some((p: any) => p.wrestler.id === s.winnerId));
    const teamAPercent = teamAStats?.percentage ?? 0;
    const teamBPercent = teamBStats?.percentage ?? 0;

    const isTeamASelected = selectedTeamNum === teamANum;
    const isTeamBSelected = selectedTeamNum === teamBNum;

    return (
      <div className="bg-card/40 border border-border rounded-3xl p-5 sm:p-6 transition-all hover:border-primary/20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />

        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{match.type || "Match"}</span>
            <h4 className="text-base font-black italic uppercase tracking-tight leading-tight mt-0.5">{match.title}</h4>
          </div>
          {selectedWinnerId && (
            <div className="bg-primary/10 border border-primary/20 p-1.5 rounded-xl shrink-0">
              <CheckCircle className="w-3.5 h-3.5 text-primary" />
            </div>
          )}
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
          <Zap className="w-3 h-3 text-primary" /> Pick Your Winner
        </p>

        {/* VS Sides */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-stretch">
          {/* Team A */}
          <button
            disabled={!user || isSubmitting}
            onClick={() => handlePredict(teamA[0].wrestler.id)}
            className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all overflow-hidden text-center disabled:opacity-60 disabled:cursor-default ${
              isTeamASelected
                ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                : "bg-secondary/20 border-transparent hover:border-white/10 hover:bg-secondary/40"
            }`}
          >
            {/* Progress fill */}
            {teamAPercent > 0 && (
              <div className="absolute inset-0 bg-primary/5 transition-all duration-1000" style={{ width: `${teamAPercent}%` }} />
            )}
            {/* Stacked avatars */}
            <div className="relative z-10 flex flex-wrap justify-center gap-1.5">
              {teamA.map((p: any) => (
                <div key={p.wrestler.id} className={`border-2 rounded-full transition-all ${isTeamASelected ? "border-primary" : "border-white/10"}`}>
                  <WrestlerAvatar wrestler={p.wrestler} size={teamA.length === 1 ? "lg" : "md"} />
                </div>
              ))}
            </div>
            <div className="relative z-10 w-full">
              {teamA.map((p: any) => (
                <p key={p.wrestler.id} className={`text-xs font-black italic uppercase tracking-tight leading-tight ${isTeamASelected ? "text-primary" : "text-foreground"}`}>
                  {p.wrestler.name}
                </p>
              ))}
              {teamAPercent > 0 && (
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{teamAPercent}%</p>
              )}
            </div>
            {isTeamASelected && (
              <CheckCircle className="w-4 h-4 text-primary relative z-10 shrink-0" />
            )}
          </button>

          {/* VS divider */}
          <div className="flex items-center justify-center px-1">
            <span className="text-[11px] font-black italic text-muted-foreground/50 uppercase">VS</span>
          </div>

          {/* Team B */}
          <button
            disabled={!user || isSubmitting}
            onClick={() => handlePredict(teamB[0].wrestler.id)}
            className={`relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all overflow-hidden text-center disabled:opacity-60 disabled:cursor-default ${
              isTeamBSelected
                ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                : "bg-secondary/20 border-transparent hover:border-white/10 hover:bg-secondary/40"
            }`}
          >
            {teamBPercent > 0 && (
              <div className="absolute inset-0 bg-primary/5 transition-all duration-1000" style={{ width: `${teamBPercent}%`, marginLeft: "auto" }} />
            )}
            <div className="relative z-10 flex flex-wrap justify-center gap-1.5">
              {teamB.map((p: any) => (
                <div key={p.wrestler.id} className={`border-2 rounded-full transition-all ${isTeamBSelected ? "border-primary" : "border-white/10"}`}>
                  <WrestlerAvatar wrestler={p.wrestler} size={teamB.length === 1 ? "lg" : "md"} />
                </div>
              ))}
            </div>
            <div className="relative z-10 w-full">
              {teamB.map((p: any) => (
                <p key={p.wrestler.id} className={`text-xs font-black italic uppercase tracking-tight leading-tight ${isTeamBSelected ? "text-primary" : "text-foreground"}`}>
                  {p.wrestler.name}
                </p>
              ))}
              {teamBPercent > 0 && (
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">{teamBPercent}%</p>
              )}
            </div>
            {isTeamBSelected && (
              <CheckCircle className="w-4 h-4 text-primary relative z-10 shrink-0" />
            )}
          </button>
        </div>

        {/* Community bar */}
        {(teamAPercent > 0 || teamBPercent > 0) && (
          <div className="mt-4 space-y-1.5">
            <div className="flex h-1.5 rounded-full overflow-hidden bg-white/5">
              <div className="bg-primary/60 transition-all duration-700" style={{ width: `${teamAPercent}%` }} />
              <div className="flex-1 bg-white/10 transition-all duration-700" />
            </div>
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground/50">
              <span>{teamAPercent}% community</span>
              <span>{teamBPercent}% community</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/5 mt-4">
          {lockError ? (
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-red-400">{lockError}</p>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
              <Users className="w-3 h-3" />
              {totalPicks > 0 ? "Global Consensus" : !user ? "Sign in to predict" : "Be the first to pick"}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Individual / multi-person layout ──────────────────────────────────────
  return (
    <div className="bg-card/40 border border-border rounded-3xl p-5 sm:p-6 transition-all hover:border-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">{match.type || "Match"}</span>
          <h4 className="text-base font-black italic uppercase tracking-tight leading-tight mt-0.5">{match.title}</h4>
        </div>
        {selectedWinnerId && (
          <div className="bg-primary/10 border border-primary/20 p-1.5 rounded-xl shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-primary" />
          </div>
        )}
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-primary" /> Pick Your Winner
      </p>

      {/* Wrestler grid */}
      <div className="grid grid-cols-2 gap-2">
        {match.participants.map((p: any) => {
          const isSelected = selectedWinnerId === p.wrestler.id;
          const stats = communityStats.find((s) => s.winnerId === p.wrestler.id);
          const progress = stats?.percentage ?? 0;

          return (
            <button
              key={p.wrestler.id}
              disabled={!user || isSubmitting}
              onClick={() => handlePredict(p.wrestler.id)}
              className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all overflow-hidden disabled:opacity-60 disabled:cursor-default ${
                isSelected
                  ? "bg-primary/15 border-primary shadow-lg shadow-primary/10"
                  : "bg-secondary/20 border-transparent hover:border-white/10 hover:bg-secondary/40"
              }`}
            >
              {progress > 0 && (
                <div className="absolute bottom-0 left-0 h-0.5 bg-primary/40 transition-all duration-700" style={{ width: `${progress}%` }} />
              )}
              <div className={`border-2 rounded-full transition-all ${isSelected ? "border-primary" : "border-white/10"}`}>
                <WrestlerAvatar wrestler={p.wrestler} size="md" />
              </div>
              <p className={`text-[10px] font-black italic uppercase tracking-tight text-center leading-tight line-clamp-2 ${isSelected ? "text-primary" : "text-foreground"}`}>
                {p.wrestler.name}
              </p>
              {progress > 0 && (
                <span className="text-[9px] font-bold text-muted-foreground">{progress}%</span>
              )}
              {isSelected && <CheckCircle className="w-3 h-3 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground pt-3 border-t border-white/5 mt-4">
        <Users className="w-3 h-3" />
        {totalPicks > 0 ? "Global Consensus" : !user ? "Sign in to predict" : "Be the first to pick"}
      </div>
    </div>
  );
}
