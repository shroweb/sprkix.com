"use client";

import { useMemo, useRef, useState } from "react";
import { Trophy, CheckCircle, XCircle, Users, Lock, Zap, Crown, Loader2, Check } from "lucide-react";
import SignUpPrompt from "@components/SignUpPrompt";
import { BeltArt } from "@components/BeltImage";
import { parseChampionship } from "@lib/belts";

interface Wrestler {
  id: string;
  name: string;
  imageUrl?: string | null;
}
interface Participant {
  team?: number | null;
  isWinner?: boolean | null;
  wrestler: Wrestler;
}
export interface CommunityStat {
  winnerId: string;
  percentage: number;
  count?: number;
}

function WrestlerAvatar({ wrestler, size = "md" }: { wrestler: Wrestler; size?: "sm" | "md" | "lg" }) {
  const sizeClass = size === "lg" ? "w-20 h-20 text-lg" : size === "sm" ? "w-7 h-7 text-[9px]" : "w-14 h-14 text-sm";
  const words = wrestler.name ? wrestler.name.trim().split(/\s+/) : [];
  const initial =
    words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : (words[0]?.slice(0, 2).toUpperCase() ?? "?");

  if (wrestler.imageUrl) {
    return (
      <div className={`${sizeClass} overflow-hidden shrink-0 bg-secondary`}>
        <img src={wrestler.imageUrl} alt={wrestler.name} className="w-full h-full object-cover object-top" loading="lazy" />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} flex items-center justify-center bg-primary/15 text-primary font-black leading-none select-none shrink-0`}>
      {initial}
    </div>
  );
}

/** Belt + clean title, with the stipulation as a separate tag instead of repeating the name. */
function MatchHeader({ match, status }: { match: { type?: string | null; title?: string | null }; status?: React.ReactNode }) {
  const champ = parseChampionship(match.type, match.title);
  const raw = (match.title || match.type || "Match").trim();
  const clean = (v?: string | null) => (v ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  const stipulation =
    match.type && clean(match.type) !== clean(match.title) && !champ ? match.type : null;
  const heading = champ ? champ.name : raw;

  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="flex items-center gap-4 min-w-0">
        {champ && (
          <BeltArt
            style={champ.style}
            label={champ.label}
            name={champ.name}
            height={44}
            className="shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {champ ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 border border-primary/30 px-2 py-0.5">
                <Crown className="w-3 h-3" /> Title match
              </span>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Match</span>
            )}
            {stipulation && (
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground border border-border px-2 py-0.5">
                {stipulation}
              </span>
            )}
          </div>
          <h4 className="text-base font-black italic uppercase tracking-tight leading-tight break-words">{heading}</h4>
        </div>
      </div>
      {status}
    </div>
  );
}

interface PredictionCardProps {
  match: any;
  user: any;
  initialPredictionId?: string | null;
  communityStats?: CommunityStat[];
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
  // Imports often omit team numbers for tag matches. When the match is clearly a team match
  // (tag / trios / six-man / eight-man) with an even field, the card lists each side's
  // partners together, so split the field in half: side one, then side two.
  const participants: Participant[] = useMemo(() => {
    const list: Participant[] = match.participants ?? [];
    const teamsGiven = new Set(list.map((p) => p.team).filter((t) => t != null)).size >= 2;
    const teamMatch = /\b(tag|trios?|six[\s-]?man|eight[\s-]?man|6[\s-]?man|8[\s-]?man)\b/i.test(
      `${match.type ?? ""} ${match.title ?? ""}`,
    );
    if (teamsGiven || !teamMatch || list.length < 4 || list.length % 2 !== 0) return list;
    const half = list.length / 2;
    return list.map((p, i) => ({ ...p, team: i < half ? 1 : 2 }));
  }, [match.participants, match.type, match.title]);
  const [selectedId, setSelectedId] = useState<string | null>(initialPredictionId || null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignUp, setShowSignUp] = useState(false);
  const inFlight = useRef(false);

  // ── Teams: only group when there are genuinely ≥2 distinct team numbers ──
  const teamNums = Array.from(new Set(participants.map((p) => p.team).filter((t): t is number => t != null)));
  const hasTeams = teamNums.length >= 2;
  const teamOf = (id: string | null) => (id ? (participants.find((p) => p.wrestler.id === id)?.team ?? null) : null);
  const selectedTeam = hasTeams ? teamOf(selectedId) : null;

  // ── Community numbers: server counts, adjusted live for this user's own pick ──
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const s of communityStats) c[s.winnerId] = s.count ?? s.percentage;
    if (initialPredictionId && c[initialPredictionId]) c[initialPredictionId] -= 1;
    if (selectedId) c[selectedId] = (c[selectedId] ?? 0) + 1;
    return c;
  }, [communityStats, initialPredictionId, selectedId]);
  const totalPicks = Object.values(counts).reduce((a, b) => a + Math.max(0, b), 0);
  const pct = (ids: string[]) =>
    totalPicks === 0 ? 0 : Math.round((ids.reduce((a, id) => a + Math.max(0, counts[id] ?? 0), 0) / totalPicks) * 100);

  async function pick(wrestlerId: string) {
    if (readOnly) return;
    if (!user) return setShowSignUp(true);
    if (inFlight.current) return;

    const clickedTeam = teamOf(wrestlerId);
    const same = hasTeams ? clickedTeam !== null && clickedTeam === selectedTeam : selectedId === wrestlerId;
    const next = same ? null : wrestlerId;
    const previous = selectedId;

    inFlight.current = true;
    setError(null);
    setSaved(false);
    setSelectedId(next);
    setSaving(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, predictedWinnerId: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSelectedId(previous);
        if (res.status === 401) setShowSignUp(true); // session expired / signed out
        else setError(data.error || "Couldn't save your pick. Try again.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 1800);
      }
    } catch {
      setSelectedId(previous);
      setError("Couldn't save your pick. Check your connection and try again.");
    } finally {
      inFlight.current = false;
      setSaving(false);
    }
  }

  // ─── Archive / read-only ───────────────────────────────────────────────────
  if (readOnly) {
    const winners = participants.filter((p) => p.isWinner).map((p) => p.wrestler);
    const predicted = initialPredictionId ? participants.find((p) => p.wrestler.id === initialPredictionId)?.wrestler : null;
    const resolved = userPredictionIsCorrect !== null;
    const badge = predicted ? (
      resolved ? (
        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border shrink-0 ${userPredictionIsCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {userPredictionIsCorrect ? <><CheckCircle className="w-3 h-3" /> Called it</> : <><XCircle className="w-3 h-3" /> Missed</>}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest border border-border text-muted-foreground shrink-0">
          <Lock className="w-3 h-3" /> Pending
        </div>
      )
    ) : null;

    return (
      <div className="bg-card/40 border border-border p-5 sm:p-6">
        <MatchHeader match={match} status={badge} />
        {winners.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Trophy className="w-3 h-3 text-primary" /> Winner{winners.length > 1 ? "s" : ""}
            </p>
            <div className="flex flex-wrap gap-2">
              {winners.map((w) => {
                const mine = w.id === initialPredictionId;
                return (
                  <div key={w.id} className={`flex items-center gap-2 px-3 py-2 border ${mine && userPredictionIsCorrect ? "bg-emerald-500/10 border-emerald-500/30" : "bg-primary/10 border-primary/25"}`}>
                    <WrestlerAvatar wrestler={w} size="sm" />
                    <span className="text-sm font-black italic uppercase tracking-tight">{w.name}</span>
                    {mine && userPredictionIsCorrect && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {predicted && !userPredictionIsCorrect && resolved && (
          <p className="text-xs text-muted-foreground mt-3">
            You picked <span className="font-bold text-foreground">{predicted.name}</span>.
          </p>
        )}
        <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} reason="predict" />
      </div>
    );
  }

  // ─── Interactive ───────────────────────────────────────────────────────────
  const statusChip = (
    <div className="shrink-0 h-7 flex items-center">
      {saving ? (
        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
      ) : saved ? (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400"><Check className="w-3.5 h-3.5" /> Saved</span>
      ) : selectedId ? (
        <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary"><CheckCircle className="w-3.5 h-3.5" /> Picked</span>
      ) : null}
    </div>
  );

  const sides: { key: string; members: Participant[]; label?: string }[] = hasTeams
    ? teamNums.map((n) => ({ key: `t${n}`, members: participants.filter((p) => p.team === n) }))
    : participants.map((p) => ({ key: p.wrestler.id, members: [p] }));
  const twoTeam = hasTeams && sides.length === 2;

  const footer = error ? (
    <p className="text-[11px] font-bold text-red-400" role="alert">{error}</p>
  ) : (
    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
      <Users className="w-3 h-3" />
      {totalPicks > 0
        ? `${totalPicks} ${totalPicks === 1 ? "pick" : "picks"} so far`
        : !user
          ? "Tap a side to save your pick"
          : "Be the first to pick"}
    </div>
  );

  return (
    <div className="bg-card/40 border border-border p-5 sm:p-6 hover:border-primary/30 transition-colors">
      <MatchHeader match={match} status={statusChip} />

      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-primary" /> Pick your winner
      </p>

      <div className={twoTeam ? "grid grid-cols-2 gap-3" : "grid grid-cols-2 gap-3 sm:grid-cols-2"}>
        {sides.map((side) => {
          const ids = side.members.map((m) => m.wrestler.id);
          const isSel = hasTeams ? side.members.some((m) => m.team === selectedTeam) && selectedTeam !== null : ids.includes(selectedId ?? "");
          const percent = pct(ids);
          return (
            <button
              key={side.key}
              type="button"
              disabled={saving}
              aria-pressed={isSel}
              onClick={() => pick(ids[0])}
              className={`relative flex flex-col items-center gap-3 p-4 border-2 text-center transition-colors overflow-hidden disabled:opacity-70 ${
                isSel ? "bg-primary/15 border-primary" : "bg-secondary/20 border-transparent hover:border-white/15 hover:bg-secondary/40"
              }`}
            >
              <div className="flex flex-wrap justify-center gap-2">
                {side.members.map((m) => (
                  <div key={m.wrestler.id} className={`border-2 ${isSel ? "border-primary" : "border-white/10"}`}>
                    <WrestlerAvatar wrestler={m.wrestler} size={side.members.length === 1 ? "lg" : "md"} />
                  </div>
                ))}
              </div>
              <div className="w-full space-y-0.5">
                {side.members.map((m) => (
                  <p key={m.wrestler.id} className={`text-xs font-black italic uppercase tracking-tight leading-tight break-words ${isSel ? "text-primary" : "text-foreground"}`}>
                    {m.wrestler.name}
                  </p>
                ))}
              </div>
              <div className="w-full mt-auto pt-1">
                <div className="h-1 w-full bg-white/10">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-[10px] font-bold text-muted-foreground mt-1 tabular-nums">{totalPicks > 0 ? `${percent}%` : "—"}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-3 border-t border-white/5 mt-4 min-h-[32px]">{footer}</div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} reason="predict" />
    </div>
  );
}
