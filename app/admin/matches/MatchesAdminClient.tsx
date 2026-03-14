"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Search, Edit2, Trash2, X, Save, Loader2, Star, UserCircle, Plus, ChevronLeft, ChevronRight
} from "lucide-react";

type Wrestler = { id: string; name: string; imageUrl: string | null; slug?: string };
type Participant = { id?: string; wrestler: Wrestler; team: number | null; isWinner: boolean };
type Match = {
  id: string;
  title: string;
  type: string | null;
  result: string | null;
  duration: number | null;
  order: number | null;
  event: { id: string; title: string; slug: string; date: string; promotion: string };
  participants: { id: string; wrestler: Wrestler; team: number | null; isWinner: boolean | null }[];
  ratings: { rating: number }[];
};

const MATCH_TYPES = ["singles", "tag", "triple-threat", "fatal-4-way", "ladder", "tlc", "hell-in-a-cell", "cage", "battle-royal", "other"];

function avgRating(ratings: { rating: number }[]) {
  if (!ratings.length) return null;
  return (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(2);
}

function formatDuration(secs: number | null) {
  if (!secs) return "-";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MatchesAdminClient({ allWrestlers }: { allWrestlers: Wrestler[] }) {
  const [matches, setMatches] = useState<Match[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editType, setEditType] = useState("");
  const [editResult, setEditResult] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [editParticipants, setEditParticipants] = useState<{ wrestlerId: string; name: string; imageUrl: string | null; team: number | null; isWinner: boolean }[]>([]);
  const [wrestlerSearch, setWrestlerSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const LIMIT = 30;

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: debouncedSearch, page: String(page), limit: String(LIMIT) });
      const res = await fetch(`/api/admin/matches?${params}`);
      const data = await res.json();
      setMatches(data.matches || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3500);
  };

  const openEdit = (m: Match) => {
    setEditingId(m.id);
    setEditTitle(m.title);
    setEditType(m.type || "");
    setEditResult(m.result || "");
    setEditDuration(m.duration ? String(Math.floor(m.duration / 60)) + ":" + String(m.duration % 60).padStart(2, "0") : "");
    setEditParticipants(
      m.participants.map((p) => ({
        wrestlerId: p.wrestler.id,
        name: p.wrestler.name,
        imageUrl: p.wrestler.imageUrl,
        team: p.team,
        isWinner: p.isWinner ?? false,
      }))
    );
    setWrestlerSearch("");
  };

  const parseDuration = (str: string): number | null => {
    if (!str.trim()) return null;
    const parts = str.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 1) return parts[0] * 60;
    return null;
  };

  const handleSave = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/matches/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          type: editType || null,
          result: editResult || null,
          duration: parseDuration(editDuration),
          participants: editParticipants.map((p) => ({ wrestlerId: p.wrestlerId, team: p.team, isWinner: p.isWinner })),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMatches((prev) => prev.map((m) => (m.id === editingId ? data.match : m)));
        setEditingId(null);
        showMessage("success", "Match saved.");
      } else {
        showMessage("error", data.error || "Save failed.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this match permanently?")) return;
    const res = await fetch(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMatches((prev) => prev.filter((m) => m.id !== id));
      setTotal((t) => t - 1);
      if (editingId === id) setEditingId(null);
      showMessage("success", "Match deleted.");
    } else {
      showMessage("error", "Delete failed.");
    }
  };

  const addParticipant = (w: Wrestler) => {
    if (editParticipants.some((p) => p.wrestlerId === w.id)) return;
    setEditParticipants((prev) => [...prev, { wrestlerId: w.id, name: w.name, imageUrl: w.imageUrl, team: null, isWinner: false }]);
    setWrestlerSearch("");
  };

  const removeParticipant = (wrestlerId: string) => {
    setEditParticipants((prev) => prev.filter((p) => p.wrestlerId !== wrestlerId));
  };

  const filteredWrestlers = wrestlerSearch.length > 1
    ? allWrestlers.filter((w) => w.name.toLowerCase().includes(wrestlerSearch.toLowerCase()) && !editParticipants.some((p) => p.wrestlerId === w.id)).slice(0, 8)
    : [];

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-2xl font-bold text-sm shadow-lg ${message.type === "success" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"}`}>
          {message.text}
        </div>
      )}

      {/* Search + count */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search matches, events, wrestlers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <span className="text-xs font-bold text-muted-foreground">{total} matches</span>
      </div>

      {/* Edit panel */}
      {editingId && (
        <div className="bg-white border border-border rounded-2xl p-6 space-y-5 shadow-sm">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-lg uppercase italic tracking-tight">Edit Match</h3>
            <button onClick={() => setEditingId(null)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Title</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="w-full bg-secondary border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Type</label>
              <select value={editType} onChange={(e) => setEditType(e.target.value)} className="w-full bg-secondary border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary">
                <option value="">— unset —</option>
                {MATCH_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Duration (MM:SS)</label>
              <input value={editDuration} onChange={(e) => setEditDuration(e.target.value)} placeholder="e.g. 18:35" className="w-full bg-secondary border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-1">Result</label>
              <input value={editResult} onChange={(e) => setEditResult(e.target.value)} className="w-full bg-secondary border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary" />
            </div>
          </div>

          {/* Participants */}
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-2">Participants</label>
            <div className="space-y-2 mb-3">
              {editParticipants.map((p) => (
                <div key={p.wrestlerId} className="flex items-center gap-3 bg-secondary rounded-xl px-3 py-2">
                  {p.imageUrl ? (
                    <Image src={p.imageUrl} alt={p.name} width={28} height={28} className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <UserCircle className="w-7 h-7 text-muted-foreground/40" />
                  )}
                  <span className="flex-1 text-sm font-bold">{p.name}</span>
                  <label className="flex items-center gap-1 text-xs text-emerald-600 font-bold cursor-pointer">
                    <input type="checkbox" checked={p.isWinner} onChange={(e) => setEditParticipants((prev) => prev.map((x) => x.wrestlerId === p.wrestlerId ? { ...x, isWinner: e.target.checked } : x))} className="rounded" />
                    Winner
                  </label>
                  <button onClick={() => removeParticipant(p.wrestlerId)} className="text-red-400 hover:text-red-600 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            {/* Add wrestler search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Add wrestler..."
                value={wrestlerSearch}
                onChange={(e) => setWrestlerSearch(e.target.value)}
                className="w-full bg-secondary border-none rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              {filteredWrestlers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-20 overflow-hidden">
                  {filteredWrestlers.map((w) => (
                    <button key={w.id} onClick={() => addParticipant(w)} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary text-sm text-left transition-colors">
                      {w.imageUrl ? <Image src={w.imageUrl} alt={w.name} width={24} height={24} className="w-6 h-6 rounded-full object-cover" /> : <UserCircle className="w-6 h-6 text-muted-foreground/40" />}
                      {w.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setEditingId(null)} className="px-4 py-2 bg-secondary rounded-xl text-sm font-bold hover:bg-border transition-colors">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </div>
      )}

      {/* Match list */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground font-bold italic">No matches found.</div>
        ) : (
          <div className="divide-y divide-border">
            {matches.map((m) => {
              const avg = avgRating(m.ratings);
              const isEditing = editingId === m.id;
              return (
                <div key={m.id} className={`px-6 py-4 flex items-start gap-4 hover:bg-slate-50 transition-colors ${isEditing ? "bg-primary/5" : ""}`}>
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-black text-sm uppercase italic tracking-tight truncate">{m.title}</p>
                    <p className="text-[11px] text-muted-foreground font-bold truncate">
                      {m.event.promotion} · {m.event.title.replace(/–\s*\d{4}.*$/, "").trim()} · {new Date(m.event.date).getFullYear()}
                    </p>
                    {m.participants.length > 0 && (
                      <p className="text-[11px] text-muted-foreground truncate">
                        {m.participants.map((p) => p.wrestler.name).join(" vs ")}
                      </p>
                    )}
                    {m.type && (
                      <span className="inline-block text-[9px] font-black uppercase tracking-widest bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{m.type}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    {avg && (
                      <div className="flex items-center gap-1 text-primary">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-sm font-black">{avg}</span>
                      </div>
                    )}
                    {m.duration && <span className="text-xs font-bold text-muted-foreground">{formatDuration(m.duration)}</span>}
                    <button onClick={() => isEditing ? setEditingId(null) : openEdit(m)} className={`p-2 rounded-lg transition-colors ${isEditing ? "bg-primary/10 text-primary" : "hover:bg-amber-50 text-amber-600"}`}>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(m.id)} className="p-2 hover:bg-red-50 text-red-400 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-xl border border-border hover:bg-secondary disabled:opacity-40 transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold">Page {page} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-xl border border-border hover:bg-secondary disabled:opacity-40 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
