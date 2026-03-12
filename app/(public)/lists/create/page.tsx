"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ListPlus, RefreshCcw, Globe, Lock } from "lucide-react";

export default function CreateListPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });
      const data = await res.json();
      if (res.ok) {
        router.push(`/lists/${data.id}`);
      } else {
        setError(data.error || "Failed to create list");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
            Your Collection
          </span>
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
          Create a List
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Curate your favourite shows, decades, or rivalries.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-6"
      >
        {error && (
          <p className="text-sm font-medium text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            List Title *
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Best WrestleManias Ever"
            className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this list about?"
            rows={3}
            className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm font-medium resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Visibility
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-bold ${isPublic ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
            >
              <Globe className="w-4 h-4" /> Public
            </button>
            <button
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-bold ${!isPublic ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
            >
              <Lock className="w-4 h-4" /> Private
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm font-black disabled:opacity-50"
        >
          {saving ? (
            <RefreshCcw className="w-4 h-4 animate-spin" />
          ) : (
            <ListPlus className="w-4 h-4" />
          )}
          {saving ? "Creating..." : "Create List"}
        </button>
      </form>
    </div>
  );
}
