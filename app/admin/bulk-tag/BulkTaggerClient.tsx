"use client";

import { useState } from "react";
import { Tag, Loader2, CheckCircle } from "lucide-react";

const EVENT_TYPES = ["PPV", "Weekly", "Special", "Tournament", "House Show", "Network Special", "NXT", "Debut", "Other"];

export default function BulkTaggerClient({ events }: { events: { id: string; title: string; promotion: string; type: string | null; date: string }[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tag, setTag] = useState(EVENT_TYPES[0]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(0);
  const [filter, setFilter] = useState("");

  const filtered = events.filter(e => e.title.toLowerCase().includes(filter.toLowerCase()) || e.promotion.toLowerCase().includes(filter.toLowerCase()));

  const toggle = (id: string) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(e => e.id)));
  };

  const apply = async () => {
    if (!selected.size) return;
    setLoading(true);
    setDone(0);
    for (const id of selected) {
      await fetch(`/api/admin/events/${id}/type`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: tag }),
      });
      setDone(d => d + 1);
    }
    setSelected(new Set());
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter events…"
          className="flex-1 min-w-[200px] px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        />
        <select
          value={tag}
          onChange={e => setTag(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-border text-sm font-bold bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          {EVENT_TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
        <button
          onClick={apply}
          disabled={loading || selected.size === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-black text-sm font-black rounded-xl disabled:opacity-50 hover:scale-105 transition-all"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
          {loading ? `Tagging ${done}/${selected.size}…` : `Tag ${selected.size} as ${tag}`}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-slate-50">
          <input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-4 h-4 accent-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{selected.size} selected · {filtered.length} shown</span>
        </div>
        <div className="divide-y divide-border max-h-[65vh] overflow-y-auto">
          {filtered.map(e => (
            <label key={e.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50 cursor-pointer transition-colors">
              <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggle(e.id)} className="w-4 h-4 accent-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground">{e.promotion} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
              {e.type && (
                <span className="text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary px-2 py-0.5 rounded-full shrink-0">{e.type}</span>
              )}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
