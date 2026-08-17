"use client";

import { useState, useEffect } from "react";
import { Trophy, Plus, Shield, Check, Loader2 } from "lucide-react";
import PromotionBadge from "@components/PromotionBadge";

export default function AdminChampionshipsPage() {
  const [championships, setChampionships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [shortName, setShortName] = useState("");
  const [promotion, setPromotion] = useState("WWE");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchChampionships = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/championships");
      const data = await res.json();
      setChampionships(data.championships || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChampionships();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/championships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, shortName, promotion, imageUrl }),
      });
      const data = await res.json();
      if (data.championship) {
        setTitle("");
        setShortName("");
        setImageUrl("");
        fetchChampionships();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Title Belts
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase italic tracking-tight text-slate-900">
            Championship Manager
          </h1>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Form */}
        <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4 h-fit">
          <h2 className="text-lg font-bold text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
            <Plus className="w-4 h-4 text-primary" /> Add Championship
          </h2>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Championship Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. WWE Undisputed Championship"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Short Name / Abbreviation
              </label>
              <input
                type="text"
                placeholder="e.g. WWE Champ"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Promotion
              </label>
              <select
                value={promotion}
                onChange={(e) => setPromotion(e.target.value)}
                className="w-full bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary"
              >
                <option value="WWE">WWE</option>
                <option value="AEW">AEW</option>
                <option value="NJPW">NJPW</option>
                <option value="TNA">TNA</option>
                <option value="ROH">ROH</option>
                <option value="NXT">NXT</option>
                <option value="STARDOM">STARDOM</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-primary text-black font-black uppercase italic tracking-wider rounded-xl shadow-md hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Championship"}
            </button>
          </form>
        </div>

        {/* Existing Championships List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-500" /> Tracked Titles ({championships.length})
            </h2>

            {loading ? (
              <div className="py-12 text-center">
                <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
              </div>
            ) : championships.length === 0 ? (
              <p className="text-sm text-slate-500 italic py-6 text-center">
                No championships added yet. Add your first title belt on the left.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {championships.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <PromotionBadge promotion={item.promotion} />
                        {item.shortName && (
                          <span className="text-[10px] font-mono text-slate-400 font-bold">
                            {item.shortName}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{item.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        {item._count?.matches || 0} title matches logged
                      </p>
                    </div>
                    <Trophy className="w-5 h-5 text-amber-500 shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
