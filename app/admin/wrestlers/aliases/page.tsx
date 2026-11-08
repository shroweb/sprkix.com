"use client";

import { useState, useEffect } from "react";
import { Users, Tag, Plus, Trash2, Search, Loader2 } from "lucide-react";

export default function WrestlerAliasesPage() {
  const [query, setQuery] = useState("");
  const [wrestlers, setWrestlers] = useState<any[]>([]);
  const [selectedWrestler, setSelectedWrestler] = useState<any | null>(null);
  const [aliases, setAliases] = useState<any[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [loading, setLoading] = useState(false);
  const [aliasLoading, setAliasLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setWrestlers([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/v1/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setWrestlers(data.wrestlers || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const loadAliases = async (wrestler: any) => {
    setSelectedWrestler(wrestler);
    setAliasLoading(true);
    try {
      const res = await fetch(`/api/admin/wrestlers/${wrestler.id}/aliases`);
      const data = await res.json();
      setAliases(data.aliases || []);
    } catch (err) {
      console.error(err);
    } finally {
      setAliasLoading(false);
    }
  };

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWrestler || !newAlias.trim()) return;
    try {
      const res = await fetch(`/api/admin/wrestlers/${selectedWrestler.id}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: newAlias }),
      });
      const data = await res.json();
      if (data.alias) {
        setAliases((prev) => [...prev, data.alias]);
        setNewAlias("");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteAlias = async (aliasId: string) => {
    if (!selectedWrestler) return;
    try {
      await fetch(`/api/admin/wrestlers/${selectedWrestler.id}/aliases`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aliasId }),
      });
      setAliases((prev) => prev.filter((a) => a.id !== aliasId));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-amber-500" />
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Roster Tools
          </span>
        </div>
        <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">
          Wrestler Alias Manager
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Map former gimmicks, ring names, and spelling variations to a canonical wrestler profile.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Search Wrestler */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-4 h-4 text-primary" /> Search Wrestler
          </h2>
          <input
            type="text"
            placeholder="Type wrestler name (e.g. Jon Moxley, Cody)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary"
          />

          {loading ? (
            <div className="py-6 text-center">
              <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {wrestlers.map((w) => (
                <button
                  key={w.id}
                  onClick={() => loadAliases(w)}
                  className={`w-full p-3 rounded-xl text-left border flex items-center justify-between transition-colors ${
                    selectedWrestler?.id === w.id
                      ? "bg-primary/10 border-primary text-slate-900 font-bold"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                >
                  <span className="text-xs font-bold">{w.name}</span>
                  <Tag className="w-3.5 h-3.5 opacity-40" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Alias Manager */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-sm">
          {selectedWrestler ? (
            <>
              <div className="space-y-1 border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900 italic uppercase">
                  {selectedWrestler.name}
                </h2>
                <p className="text-xs text-slate-400">Ring Name Aliases</p>
              </div>

              <form onSubmit={handleAddAlias} className="flex items-center gap-2">
                <input
                  type="text"
                  required
                  placeholder="e.g. Dean Ambrose"
                  value={newAlias}
                  onChange={(e) => setNewAlias(e.target.value)}
                  className="flex-1 bg-slate-50 border border-border rounded-xl px-4 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:border-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-black font-black uppercase text-xs rounded-xl shadow hover:opacity-90 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add
                </button>
              </form>

              {aliasLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
                </div>
              ) : aliases.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">
                  No aliases added for {selectedWrestler.name}.
                </p>
              ) : (
                <div className="space-y-2">
                  {aliases.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-bold text-slate-800"
                    >
                      <span>{a.alias}</span>
                      <button
                        onClick={() => handleDeleteAlias(a.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs italic">
              Select a wrestler on the left to manage aliases.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
