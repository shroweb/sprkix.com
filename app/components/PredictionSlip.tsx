"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Target, Sparkles } from "lucide-react";
import Confetti from "./Confetti";

/**
 * Wraps a grid of PredictionCards and shows a sticky "slip" with live progress.
 * Cards announce picks through a `pr:pick` window event (see PredictionCard).
 */
export default function PredictionSlip({
  matchIds,
  pickedIds,
  signedIn,
  children,
}: {
  matchIds: string[];
  pickedIds: string[];
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const [picked, setPicked] = useState<Set<string>>(() => new Set(pickedIds));
  const [burst, setBurst] = useState(false);
  const pickedRef = useRef(picked);
  useEffect(() => {
    pickedRef.current = picked;
  }, [picked]);
  const wasComplete = useRef(matchIds.length > 0 && matchIds.every((id) => pickedIds.includes(id)));

  useEffect(() => {
    const onPick = (e: Event) => {
      const { matchId, picked: on } = (e as CustomEvent<{ matchId: string; picked: boolean }>).detail;
      setPicked((prev) => {
        const next = new Set(prev);
        if (on) next.add(matchId);
        else next.delete(matchId);
        return next;
      });
      if (on) {
        const all = matchIds.every((id) => id === matchId || pickedRef.current.has(id));
        if (all && !wasComplete.current) {
          setBurst(true);
          setTimeout(() => setBurst(false), 3200);
        }
      }
    };
    window.addEventListener("pr:pick", onPick);
    return () => window.removeEventListener("pr:pick", onPick);
  }, [matchIds]);

  const total = matchIds.length;
  const done = matchIds.filter((id) => picked.has(id)).length;

  // Fire the burst from the pick event itself (an event callback, not an effect body).
  const complete = total > 0 && done === total;
  useEffect(() => {
    wasComplete.current = complete;
  }, [complete]);

  return (
    <div>
      {children}
      {total > 0 && (
        <div className="sticky bottom-20 z-30 mt-6 md:bottom-4" role="status" aria-live="polite">
          <div
            className={`mx-auto flex max-w-xl items-center gap-4 border px-4 py-3 shadow-2xl backdrop-blur-xl transition-colors ${
              complete ? "border-emerald-400/50 bg-emerald-950/90" : "border-white/15 bg-slate-950/90"
            }`}
          >
            <div className={`grid h-9 w-9 shrink-0 place-items-center ${complete ? "bg-emerald-400 text-emerald-950" : "bg-primary/15 text-primary"}`}>
              {complete ? <Check className="h-5 w-5" /> : <Target className="h-5 w-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-tight">
                {!signedIn
                  ? "Sign in to lock in your picks"
                  : complete
                    ? "Card locked in — good luck!"
                    : `${done} of ${total} picked`}
              </p>
              <div className="mt-1.5 h-1 w-full bg-white/10">
                <div
                  className={`h-full transition-all duration-500 ${complete ? "bg-emerald-400" : "bg-primary"}`}
                  style={{ width: `${(done / total) * 100}%` }}
                />
              </div>
            </div>
            {complete && <Sparkles className="h-5 w-5 shrink-0 text-emerald-300" />}
          </div>
        </div>
      )}
      {burst && <Confetti />}
    </div>
  );
}
