"use client";

import { useMemo, useRef, useState } from "react";
import { Trophy, CheckCircle, XCircle, Users, Lock, Zap, Crown, Loader2, Check } from "lucide-react";
import SignUpPrompt from "@components/SignUpPrompt";
import { BeltArt } from "@components/BeltImage";
import { parseChampionship } from "@lib/belts";
import { inferTeams, groupSides } from "@lib/match-sides";
import FaceOff, { Photo, COLS, colsFor, aspectFor } from "@components/FaceOff";

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
  const sizeClass = size === "lg" ? "w-20 h-20 text-lg" : size === "sm" ? "w-7 h-7 text-[11px]" : "w-14 h-14 text-sm";
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
              <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary bg-primary/10 border border-primary/30 px-2 py-0.5">
                <Crown className="w-3 h-3" /> Title match
              </span>
            ) : (
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Match</span>
            )}
            {stipulation && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground border border-border px-2 py-0.5">
                {stipulation}
              </span>
            )}
          </div>
          <h4 className="text-base font-bold uppercase tracking-tight leading-tight break-words">{heading}</h4>
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
  // Imports sometimes omit team numbers; infer them for obvious team matches.
  const participants: Participant[] = useMemo(
    () => inferTeams<Participant>(match.participants ?? [], match.type, match.title),
    [match.participants, match.type, match.title],
  );
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
        window.dispatchEvent(new CustomEvent("pr:pick", { detail: { matchId: match.id, picked: next !== null } }));
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
        <div className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border shrink-0 ${userPredictionIsCorrect ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {userPredictionIsCorrect ? <><CheckCircle className="w-3 h-3" /> Called it</> : <><XCircle className="w-3 h-3" /> Missed</>}
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider border border-border text-muted-foreground shrink-0">
          <Lock className="w-3 h-3" /> Pending
        </div>
      )
    ) : null;

    return (
      <div className="bg-card/85 border border-border p-5 sm:p-6">
        <MatchHeader match={match} status={badge} />
        {winners.length > 0 && (
          <div className="space-y-3">
            <FaceOff sides={groupSides(participants)} reveal />
            {predicted && (
              <p className={`pr-rise flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${userPredictionIsCorrect ? "text-emerald-400" : "text-red-400"}`}>
                {userPredictionIsCorrect ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                You picked {predicted.name}
              </p>
            )}
          </div>
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
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400"><Check className="w-3.5 h-3.5" /> Saved</span>
      ) : selectedId ? (
        <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-primary"><CheckCircle className="w-3.5 h-3.5" /> Picked</span>
      ) : null}
    </div>
  );

  const sides: { key: string; members: Participant[]; label?: string }[] = hasTeams
    ? teamNums.map((n) => ({ key: `t${n}`, members: participants.filter((p) => p.team === n) }))
    : participants.map((p) => ({ key: p.wrestler.id, members: [p] }));

  const footer = error ? (
    <p className="text-[11px] font-bold text-red-400" role="alert">{error}</p>
  ) : (
    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
      <Users className="w-3 h-3" />
      {totalPicks > 0
        ? `${totalPicks} ${totalPicks === 1 ? "pick" : "picks"} so far`
        : !user
          ? "Tap a side to save your pick"
          : "Be the first to pick"}
    </div>
  );

  return (
    <div className="bg-card/85 border border-border p-5 sm:p-6 hover:border-primary/30 transition-colors">
      <MatchHeader match={match} status={statusChip} />

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-3">
        <Zap className="w-3 h-3 text-primary" /> Pick your winner
      </p>

      {sides.length === 2 && (
        <div className="space-y-3">
          <div className="relative grid grid-cols-2 gap-1">
            {sides.map((side) => {
              const ids = side.members.map((m) => m.wrestler.id);
              const isSel = hasTeams ? side.members.some((m) => m.team === selectedTeam) && selectedTeam !== null : ids.includes(selectedId ?? "");
              const other = selectedId !== null && !isSel;
              return (
                <button
                  key={side.key}
                  type="button"
                  disabled={saving}
                  aria-pressed={isSel}
                  aria-label={`Pick ${side.members.map((m) => m.wrestler.name).join(" and ")}`}
                  onClick={() => pick(ids[0])}
                  className={`group relative overflow-hidden text-left outline-none transition-all focus-visible:ring-2 focus-visible:ring-primary ${isSel ? "ring-2 ring-primary" : "ring-1 ring-white/10 hover:ring-white/30"} ${other ? "opacity-60" : ""}`}
                >
                  {side.members.length > 1 ? (
                    <div className={`grid gap-px ${COLS[colsFor(Math.min(side.members.length, 6))]} ${aspectFor(Math.min(side.members.length, 6), true)}`}>
                      {side.members.slice(0, 6).map((m) => (
                        <Photo key={m.wrestler.id} name={m.wrestler.name} src={m.wrestler.imageUrl} tall fill label />
                      ))}
                    </div>
                  ) : (
                    <>
                      <Photo name={side.members[0].wrestler.name} src={side.members[0].wrestler.imageUrl} tall />
                      <div className="absolute inset-x-0 bottom-0 p-2.5">
                        <p className={`truncate text-xs font-bold uppercase leading-tight tracking-tight sm:text-sm ${isSel ? "text-primary" : "text-white"}`}>
                          {side.members[0].wrestler.name}
                        </p>
                      </div>
                    </>
                  )}
                  {isSel && (
                    <span className="pr-rise absolute right-2 top-2 inline-flex items-center gap-1 bg-primary px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary-foreground">
                      <Check className="h-3 w-3" /> Your pick
                    </span>
                  )}
                </button>
              );
            })}
            <span className="pointer-events-none absolute left-1/2 top-1/2 z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center border border-white/20 bg-slate-950 text-[11px] font-bold text-white">
              VS
            </span>
          </div>
          {/* community split */}
          {(() => {
            const a = pct(sides[0].members.map((m) => m.wrestler.id));
            const b = pct(sides[1].members.map((m) => m.wrestler.id));
            const none = totalPicks === 0;
            return (
              <div>
                <div className="flex h-2 w-full overflow-hidden bg-white/10">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: none ? "50%" : `${a}%`, opacity: none ? 0.25 : 1 }} />
                  <div className="h-full bg-sky-400 transition-all duration-500" style={{ width: none ? "50%" : `${b}%`, opacity: none ? 0.25 : 1 }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-bold tabular-nums text-muted-foreground">
                  <span className="text-primary">{none ? "—" : `${a}%`}</span>
                  <span className="uppercase tracking-wider">Community</span>
                  <span className="text-sky-400">{none ? "—" : `${b}%`}</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {sides.length !== 2 && (
      <div className="grid grid-cols-2 gap-3">
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
                  <p key={m.wrestler.id} className={`text-xs font-bold uppercase tracking-tight leading-tight break-words ${isSel ? "text-primary" : "text-foreground"}`}>
                    {m.wrestler.name}
                  </p>
                ))}
              </div>
              <div className="w-full mt-auto pt-1">
                <div className="h-1 w-full bg-white/10">
                  <div className="h-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
                <p className="text-[11px] font-bold text-muted-foreground mt-1 tabular-nums">{totalPicks > 0 ? `${percent}%` : "—"}</p>
              </div>
            </button>
          );
        })}
      </div>
      )}

      <div className="pt-3 border-t border-white/5 mt-4 min-h-[32px]">{footer}</div>
      <SignUpPrompt open={showSignUp} onClose={() => setShowSignUp(false)} reason="predict" />
    </div>
  );
}
