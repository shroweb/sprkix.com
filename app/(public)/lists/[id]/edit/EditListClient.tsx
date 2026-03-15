"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Globe,
  Lock,
  Save,
  RefreshCcw,
} from "lucide-react";

type ListItem = {
  id: string;
  eventId: string | null;
  matchId: string | null;
  note: string | null;
  order: number;
  event: {
    id: string;
    title: string;
    posterUrl: string | null;
    slug: string;
    promotion: string;
    date: string;
  } | null;
  match: {
    id: string;
    title: string;
    event: {
      id: string;
      title: string;
      posterUrl: string | null;
      slug: string;
      promotion: string;
      date: string;
    };
    participants: { wrestler: { name: string } }[];
  } | null;
};

type List = {
  id: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  listType: string;
  items: ListItem[];
};

export default function EditListClient({ list }: { list: List }) {
  const router = useRouter();
  const [title, setTitle] = useState(list.title);
  const [description, setDescription] = useState(list.description ?? "");
  const [isPublic, setIsPublic] = useState(list.isPublic);
  const [items, setItems] = useState<ListItem[]>(list.items);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isMatchList = list.listType === "matches";

  const updateNote = async (itemId: string, note: string) => {
    setItems((prev) =>
      prev.map((it) => (it.id === itemId ? { ...it, note: note || null } : it)),
    );
    await fetch(`/api/lists/${list.id}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, note }),
    });
  };

  const moveItem = async (index: number, direction: "up" | "down") => {
    const newItems = [...items];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setItems(newItems);

    // Update order for both swapped items
    await Promise.all([
      fetch(`/api/lists/${list.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: newItems[index].id, order: index }),
      }),
      fetch(`/api/lists/${list.id}/items`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: newItems[targetIndex].id, order: targetIndex }),
      }),
    ]);
  };

  const removeItem = async (itemId: string, eventId: string | null, matchId: string | null) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    if (matchId) {
      await fetch(`/api/lists/${list.id}/items?matchId=${matchId}`, { method: "DELETE" });
    } else if (eventId) {
      await fetch(`/api/lists/${list.id}/items?eventId=${eventId}`, { method: "DELETE" });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/lists/${list.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, isPublic }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
        return;
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-20 space-y-8">
      {/* Back link */}
      <Link
        href={`/lists/${list.id}`}
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to List
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">
          Edit List
        </h1>
        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? (
            <RefreshCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {success ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-4 py-3 text-sm font-bold text-red-400">
          {error}
        </div>
      )}

      {/* List metadata */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Title
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="List title..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 font-medium text-foreground focus:outline-none focus:border-primary/50 transition-colors resize-none"
            placeholder="Describe this list..."
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsPublic(true)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
              isPublic
                ? "bg-primary text-black border-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Globe className="w-3.5 h-3.5" /> Public
          </button>
          <button
            onClick={() => setIsPublic(false)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-black uppercase tracking-wider transition-all ${
              !isPublic
                ? "bg-primary text-black border-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Private
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          Items ({items.length})
        </h2>

        {items.length === 0 ? (
          <div className="bg-card/30 border border-dashed border-border rounded-2xl p-12 text-center">
            <p className="text-muted-foreground font-bold italic">
              No {isMatchList ? "matches" : "events"} on this list yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Add {isMatchList ? "matches" : "events"} from any event page.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => {
              const isMatch = !!item.match;
              const posterUrl = item.event?.posterUrl || item.match?.event?.posterUrl || "/placeholder.png";
              const mainTitle = isMatch
                ? item.match!.title
                : (item.event?.title.replace(/–\s*\d{4}.*$/, "").trim() ?? "");
              const subtitle = isMatch
                ? (() => {
                    const teams: Record<number, string[]> = {};
                    (item.match!.participants || []).forEach((p: any, pi: number) => {
                      const t = (p as any).team ?? 1;
                      if (!teams[t]) teams[t] = [];
                      teams[t].push(p.wrestler.name);
                    });
                    return Object.values(teams).map((t) => t.join(" & ")).join(" vs ");
                  })()
                : `${item.event?.promotion} · ${item.event ? new Date(item.event.date).getFullYear() : ""}`;

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-4 bg-card border border-border rounded-2xl p-4 group"
                >
                  {/* Poster */}
                  <div className="relative w-10 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                    <Image
                      src={posterUrl}
                      alt={mainTitle}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="font-black text-sm italic uppercase tracking-tight leading-tight truncate">
                        {mainTitle}
                      </p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                        {subtitle}
                      </p>
                    </div>
                    <input
                      defaultValue={item.note ?? ""}
                      onBlur={(e) => updateNote(item.id, e.target.value)}
                      placeholder="Add a note..."
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      onClick={() => moveItem(idx, "up")}
                      disabled={idx === 0}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Move up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveItem(idx, "down")}
                      disabled={idx === items.length - 1}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      title="Move down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => removeItem(item.id, item.eventId, item.matchId)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 hover:text-red-400 text-muted-foreground transition-colors"
                      title="Remove from list"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
