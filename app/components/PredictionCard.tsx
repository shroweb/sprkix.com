"use client";

import { useState } from "react";
import { Trophy, CheckCircle, XCircle, Percent, Users, Lock } from "lucide-react";

/** Shows a wrestler's image, or a coloured circle with their initial if no image is set. */
function WrestlerAvatar({
  wrestler,
  className = "",
}: {
  wrestler: { name: string; imageUrl?: string | null };
  className?: string;
}) {
  if (wrestler.imageUrl) {
    return (
      <img
        src={wrestler.imageUrl}
        alt={wrestler.name}
        className={`w-full h-full object-cover ${className}`}
      />
    );
  }
  const words = wrestler.name ? wrestler.name.trim().split(/\s+/) : [];
  const initial = words.length >= 2
    ? (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
    : words[0]?.slice(0, 2).toUpperCase() ?? "?";
  return (
    <div className={`w-full h-full flex items-center justify-center bg-primary/20 text-primary font-black text-xs leading-none select-none ${className}`}>
      {initial}
    </div>
  );
}

interface PredictionCardProps {
  match: any;
  user: any;
  initialPredictionId?: string | null;
  communityStats?: { winnerId: string; percentage: number }[];
  /** Archive / read-only mode — shows resolved outcomes instead of the prediction interface */
  readOnly?: boolean;
  /** Whether the user's prediction was correct. null = unresolved or no prediction made */
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

  // Group participants into teams
  const teams: Record<number, any[]> = {};
  match.participants.forEach((p: any) => {
    const t = p.team || 1;
    if (!teams[t]) teams[t] = [];
    teams[t].push(p);
  });

  const handlePredict = async (wrestlerId: string) => {
    if (!user || isSubmitting || readOnly) return;

    const newWinnerId = selectedWinnerId === wrestlerId ? null : wrestlerId;

    setIsSubmitting(true);
    setSelectedWinnerId(newWinnerId);

    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId: match.id,
          predictedWinnerId: newWinnerId,
        }),
      });

      if (!res.ok) {
        setSelectedWinnerId(selectedWinnerId);
      }
    } catch (err) {
      console.error("Prediction failed:", err);
      setSelectedWinnerId(selectedWinnerId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const teamEntries = Object.entries(teams);

  // ─── Archive / Read-only mode ─────────────────────────────────────────────
  if (readOnly) {
    const actualWinners = match.participants
      .filter((p: any) => p.isWinner)
      .map((p: any) => p.wrestler);

    const predictedWrestler = initialPredictionId
      ? match.participants.find((p: any) => p.wrestler.id === initialPredictionId)?.wrestler
      : null;

    const hasResolved = userPredictionIsCorrect !== null;
    const hasPrediction = !!predictedWrestler;

    return (
      <div className="bg-card/40 border border-border rounded-3xl p-6 transition-all group relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                {match.type || "Match"}
              </span>
              <h4 className="text-lg font-black italic uppercase tracking-tight leading-tight">
                {match.title}
              </h4>
            </div>
            {/* Outcome badge */}
            {hasPrediction && hasResolved && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                  userPredictionIsCorrect
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    : "bg-red-500/10 border-red-500/30 text-red-400"
                }`}
              >
                {userPredictionIsCorrect ? (
                  <><CheckCircle className="w-3 h-3" /> Called It!</>
                ) : (
                  <><XCircle className="w-3 h-3" /> Wrong Pick</>
                )}
              </div>
            )}
            {hasPrediction && !hasResolved && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground">
                <Lock className="w-3 h-3" /> Pending
              </div>
            )}
          </div>

          {/* Winner(s) revealed */}
          {actualWinners.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Trophy className="w-3 h-3 text-yellow-400" /> Result
              </p>
              <div className="flex flex-wrap gap-2">
                {actualWinners.map((w: any) => (
                  <div
                    key={w.id}
                    className="flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/20 px-3 py-2 rounded-xl"
                  >
                    <div className="w-7 h-7 rounded-full overflow-hidden border-2 border-yellow-400/40 shrink-0">
                      <WrestlerAvatar wrestler={w} />
                    </div>
                    <span className="text-sm font-black italic uppercase tracking-tight text-yellow-400">
                      {w.name}
                    </span>
                    <Trophy className="w-3 h-3 text-yellow-400 fill-yellow-400/40" />
                  </div>
                ))}
              </div>
              {match.result && (
                <p className="text-xs text-muted-foreground italic font-medium mt-1">
                  {match.result}
                </p>
              )}
            </div>
          )}

          {/* User's prediction */}
          {hasPrediction ? (
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CheckCircle className="w-3 h-3 text-primary" /> Your Pick
              </p>
              <div
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 ${
                  !hasResolved
                    ? "border-border bg-secondary/20"
                    : userPredictionIsCorrect
                    ? "border-emerald-500/40 bg-emerald-500/10"
                    : "border-red-500/40 bg-red-500/10"
                }`}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white/10 shrink-0">
                  <WrestlerAvatar wrestler={predictedWrestler} />
                </div>
                <span
                  className={`text-sm font-black italic uppercase tracking-tight ${
                    !hasResolved
                      ? "text-foreground"
                      : userPredictionIsCorrect
                      ? "text-emerald-400"
                      : "text-red-400"
                  }`}
                >
                  {predictedWrestler.name}
                </span>
                {hasResolved && (
                  <span className="ml-auto">
                    {userPredictionIsCorrect ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-[11px] italic text-muted-foreground/60 font-medium">
              You didn't make a prediction for this match.
            </p>
          )}

          {/* Community stats */}
          {communityStats.length > 0 && (
            <div className="pt-3 border-t border-white/5 space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="w-3 h-3" /> Community Picks
              </p>
              <div className="flex flex-wrap gap-2">
                {communityStats
                  .sort((a, b) => b.percentage - a.percentage)
                  .slice(0, 4)
                  .map((s) => {
                    const wrestler = match.participants.find(
                      (p: any) => p.wrestler.id === s.winnerId
                    )?.wrestler;
                    if (!wrestler) return null;
                    return (
                      <div
                        key={s.winnerId}
                        className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-lg text-[10px] font-bold"
                      >
                        <div className="w-4 h-4 rounded-full overflow-hidden shrink-0">
                          <WrestlerAvatar wrestler={wrestler} />
                        </div>
                        <span className="text-muted-foreground">{wrestler.name}</span>
                        <span className="text-primary font-black">{s.percentage}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Interactive / Upcoming mode ─────────────────────────────────────────
  return (
    <div className="bg-card/40 border border-border rounded-3xl p-6 transition-all hover:border-primary/30 group relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16 pointer-events-none" />

      <div className="flex flex-col gap-6">
        {/* Match Header */}
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary italic">
                {match.type || "Match"}
              </span>
            </div>
            <h4 className="text-lg font-black italic uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">
              {match.title}
            </h4>
          </div>
          {selectedWinnerId && (
            <div className="bg-primary/10 border border-primary/20 p-2 rounded-xl animate-in zoom-in-90 duration-300">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
          )}
        </div>

        {/* Prediction Interface */}
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Trophy className="w-3 h-3 text-primary" /> Pick Your Winner
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {teamEntries.map(([teamNum, participants], tIdx) => (
              <div key={`team-${teamNum}`} className="flex flex-col gap-2">
                {tIdx > 0 && (
                  <div className="md:hidden flex items-center justify-center py-1">
                    <span className="text-[10px] font-black text-muted-foreground uppercase">vs</span>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  {participants.map((p: any) => {
                    const isWinner = selectedWinnerId === p.wrestler.id;
                    const stats = communityStats.find((s) => s.winnerId === p.wrestler.id);
                    const progress = stats ? stats.percentage : 0;

                    return (
                      <button
                        key={p.wrestler.id}
                        disabled={!user || isSubmitting}
                        onClick={() => handlePredict(p.wrestler.id)}
                        className={`relative flex items-center justify-between p-3 rounded-2xl border-2 transition-all overflow-hidden ${
                          isWinner
                            ? "bg-primary/20 border-primary shadow-lg shadow-primary/10"
                            : "bg-secondary/30 border-transparent hover:border-white/10"
                        }`}
                      >
                        {/* Community Progress Fill */}
                        <div
                          className="absolute inset-0 bg-primary/5 transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />

                        <div className="flex items-center gap-3 relative z-10">
                          <div
                            className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${isWinner ? "border-primary" : "border-white/10"}`}
                          >
                            <WrestlerAvatar wrestler={p.wrestler} />
                          </div>
                          <div className="text-left">
                            <p
                              className={`text-sm font-black italic uppercase tracking-tight ${isWinner ? "text-primary" : "text-foreground"}`}
                            >
                              {p.wrestler.name}
                            </p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                              {progress}% Community Confidence
                            </p>
                          </div>
                        </div>

                        {isWinner && (
                          <CheckCircle className="w-4 h-4 text-primary relative z-10" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Community Footer */}
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground pt-2 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <Users className="w-3 h-3" />
            {communityStats.reduce((sum, s) => sum + 1, 0) > 0
              ? "Global Consensus"
              : "Be the first to pick"}
          </div>
        </div>
      </div>
    </div>
  );
}
