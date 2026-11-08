"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, RefreshCw, ChevronDown, AlertTriangle, ExternalLink, Loader2 } from "lucide-react";
import { BeltArt } from "@components/BeltImage";
import { styleForName } from "@lib/belts";
import { useToast } from "@components/ToastProvider";

export interface AdminTitle {
  id: string;
  slug: string;
  name: string;
  emoji: string | null;
  description: string | null;
  kind: string;
  isActive: boolean;
  allowMultiMan: boolean;
  requireClean: boolean;
  reigns: { id: string; number: number; wrestler: string; slug: string; startedAt: string; endedAt: string | null; defences: number; source: string; note: string | null }[];
}

interface ReviewRow { matchId: string; reason: string; at: string; matchTitle: string; eventId: string | null; eventTitle: string | null; names: string }
interface RecomputeOut { matchesChecked: number; reigns: number; holderChanged: boolean; previousHolder: string | null; currentHolder: string | null; reviews: ReviewRow[] }

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const days = (a: string, b: string | null) => Math.max(0, Math.floor(((b ? new Date(b).getTime() : Date.now()) - new Date(a).getTime()) / 86_400_000));

export default function LinealAdminClient({ initial }: { initial: AdminTitle[] }) {
  const [titles, setTitles] = useState(initial);
  const [open, setOpen] = useState<string | null>(initial[0]?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [out, setOut] = useState<Record<string, RecomputeOut>>({});
  const { showToast } = useToast();
  const say = (msg: string, kind: "success" | "error" = "success") => showToast(msg, kind);

  async function patch(id: string, body: Record<string, unknown>) {
    const prev = titles;
    setTitles((ts) => ts.map((t) => (t.id === id ? { ...t, ...body } : t)));
    const res = await fetch(`/api/admin/lineal/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!res.ok) {
      setTitles(prev);
      say("Couldn't save that change", "error");
    } else say("Saved");
  }

  async function recompute(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/admin/lineal/${id}/recompute`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setOut((o) => ({ ...o, [id]: data.result }));
      say(data.result.holderChanged ? `Holder changed: ${data.result.currentHolder}` : "Recomputed, no change");
    } catch (e) {
      say(e instanceof Error ? e.message : "Recompute failed", "error");
    } finally {
      setBusy(null);
    }
  }

  if (titles.length === 0) {
    return <p className="bg-card border border-border p-8 text-center text-muted-foreground">No lineal titles exist yet. Seed them with <code className="text-primary">scripts/seed-lineal.mjs</code>.</p>;
  }

  return (
    <div className="space-y-4">
      {titles.map((t) => {
        const current = t.reigns.find((r) => !r.endedAt);
        const o = out[t.id];
        const isOpen = open === t.id;
        return (
          <section key={t.id} className={`bg-card border ${t.isActive ? "border-border" : "border-border opacity-60"}`}>
            <div className="p-4 flex flex-wrap items-center gap-4">
              <BeltArt style={styleForName(t.name)} label={t.emoji ?? "👑"} name={t.name} height={44} />
              <div className="flex-1 min-w-[200px]">
                <h2 className="font-black text-lg leading-tight">{t.name}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Crown className="w-3.5 h-3.5 text-primary" />
                  {current ? (
                    <>
                      <span className="font-bold text-foreground">{current.wrestler}</span> · {days(current.startedAt, null)} days · {current.defences} defences
                    </>
                  ) : "Vacant"}
                </p>
              </div>
              <button
                onClick={() => recompute(t.id)}
                disabled={busy === t.id}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-black uppercase tracking-wider bg-primary text-primary-foreground disabled:opacity-50"
              >
                {busy === t.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />} Recompute
              </button>
              <Link href={`/lineal/${t.slug}`} target="_blank" className="p-2 border border-border text-muted-foreground hover:text-foreground" title="View public page">
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button onClick={() => setOpen(isOpen ? null : t.id)} className="p-2 border border-border text-muted-foreground hover:text-foreground" aria-label="Toggle details">
                <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </div>

            {o && (
              <div className="mx-4 mb-4 border border-border bg-background p-3 text-sm space-y-2">
                <p>
                  Checked <b>{o.matchesChecked}</b> matches · <b>{o.reigns}</b> reigns ·{" "}
                  {o.holderChanged ? <span className="text-primary font-bold">{o.previousHolder} → {o.currentHolder}</span> : <>holder unchanged ({o.currentHolder})</>}
                </p>
                {o.reviews.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="flex items-center gap-1.5 text-amber-400 font-bold text-xs uppercase tracking-wider">
                      <AlertTriangle className="w-3.5 h-3.5" /> {o.reviews.length} match{o.reviews.length > 1 ? "es" : ""} need a decision
                    </p>
                    {o.reviews.map((r) => (
                      <div key={r.matchId} className="flex flex-wrap items-center justify-between gap-2 border border-amber-500/30 bg-amber-500/5 px-3 py-2">
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{r.names || r.matchTitle}</p>
                          <p className="text-xs text-muted-foreground">{r.eventTitle} · {fmt(r.at)} · {r.reason}</p>
                        </div>
                        {r.eventId && (
                          <Link href={`/admin/events/${r.eventId}/results`} className="text-xs font-bold text-primary hover:underline shrink-0">
                            Fix result →
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {isOpen && (
              <div className="border-t border-border p-4 grid gap-6 lg:grid-cols-[320px_1fr]">
                <div className="space-y-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground">Rules</p>
                  <Toggle label="Active (visible on site)" checked={t.isActive} onChange={(v) => patch(t.id, { isActive: v })} />
                  <Toggle label="Clean finishes only" hint="DQ, count-out and no-contest don't change the holder" checked={t.requireClean} onChange={(v) => patch(t.id, { requireClean: v })} />
                  <Toggle label="Allow multi-man matches" hint="Triple threats etc. pass the title to the winner" checked={t.allowMultiMan} onChange={(v) => patch(t.id, { allowMultiMan: v })} />
                  <p className="text-xs text-muted-foreground pt-1">Rule changes apply on the next recompute.</p>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-3">Reign history ({t.reigns.length})</p>
                  <div className="border border-border divide-y divide-border max-h-96 overflow-y-auto">
                    {t.reigns.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 px-3 py-2 text-sm">
                        <span className="w-8 text-xs font-black text-muted-foreground">#{r.number}</span>
                        <Link href={`/wrestlers/${r.slug}`} target="_blank" className="font-bold hover:text-primary truncate flex-1">{r.wrestler}</Link>
                        <span className="text-xs text-muted-foreground hidden sm:block">{fmt(r.startedAt)} – {r.endedAt ? fmt(r.endedAt) : "now"}</span>
                        <span className="text-xs tabular-nums w-14 text-right">{days(r.startedAt, r.endedAt)}d</span>
                        {r.source === "seed" && <span className="text-[10px] font-black uppercase tracking-wider text-primary border border-primary/40 px-1.5 py-0.5">seed</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start justify-between gap-4 cursor-pointer">
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 shrink-0 mt-0.5 border transition-colors ${checked ? "bg-primary border-primary" : "bg-secondary border-border"}`}
      >
        <span className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${checked ? "left-[22px] bg-primary-foreground" : "left-0.5 bg-slate-400"}`} />
      </button>
    </label>
  );
}
