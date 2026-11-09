"use client";

import { useEffect, useState } from "react";
import { Share2, Download, Check, Sparkles } from "lucide-react";
import Confetti from "./Confetti";

export default function RecapCard({
  eventSlug,
  eventTitle,
  userSlug,
  correct,
  total,
  perfect,
  bestCall,
  worstMiss,
}: {
  eventSlug: string;
  eventTitle: string;
  userSlug: string;
  correct: number;
  total: number;
  perfect: boolean;
  bestCall: { picked: string; communityPct: number } | null;
  worstMiss: { picked: string; communityPct: number } | null;
}) {
  const [copied, setCopied] = useState(false);
  const [burst, setBurst] = useState(false);
  const imgPath = `/api/og/recap?event=${encodeURIComponent(eventSlug)}&user=${encodeURIComponent(userSlug)}`;
  const pct = Math.round((correct / total) * 100);

  // One celebration per perfect card, ever (per browser).
  useEffect(() => {
    if (!perfect) return;
    try {
      const key = `pr_recap_${eventSlug}`;
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      /* storage blocked: celebrate anyway */
    }
    setBurst(true); // eslint-disable-line react-hooks/set-state-in-effect
    const t = setTimeout(() => setBurst(false), 3500);
    return () => clearTimeout(t);
  }, [perfect, eventSlug]);

  const share = async () => {
    const url = `${window.location.origin}${imgPath}`;
    try {
      if (navigator.share) await navigator.share({ title: `${correct}/${total} on ${eventTitle}`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      /* cancelled */
    }
  };

  const tone = perfect ? "border-emerald-400/50 bg-emerald-950/40" : "border-white/10 bg-card/40";
  return (
    <section className={`space-y-4 border p-5 sm:p-6 ${tone}`} aria-label="Your recap">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-primary">
          <Sparkles className="h-4 w-4" /> {perfect ? "Perfect card!" : "Your recap"}
        </p>
        <div className="flex gap-2">
          <button onClick={share} className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-white/50">
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />} {copied ? "Link copied" : "Share"}
          </button>
          <a href={imgPath} download={`${eventSlug}-recap.png`} className="inline-flex items-center gap-1.5 border border-white/20 px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:border-white/50">
            <Download className="h-3.5 w-3.5" /> Image
          </a>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="text-center sm:pr-6">
          <p className="text-6xl font-black tabular-nums leading-none">{correct}<span className="text-muted-foreground">/{total}</span></p>
          <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{pct}% correct</p>
        </div>
        <ul className="space-y-2 text-sm">
          {bestCall && (
            <li><span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Best call · </span><strong>{bestCall.picked}</strong> <span className="text-muted-foreground">— only {bestCall.communityPct}% agreed</span></li>
          )}
          {worstMiss && (
            <li><span className="text-[10px] font-black uppercase tracking-widest text-red-400">Toughest miss · </span><strong>{worstMiss.picked}</strong> <span className="text-muted-foreground">— {worstMiss.communityPct}% had them too</span></li>
          )}
        </ul>
      </div>
      {burst && <Confetti />}
    </section>
  );
}
