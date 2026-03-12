"use client";
import { useState, useEffect } from "react";
import { Plus, Trash2, Tag, ChevronDown, ChevronUp } from "lucide-react";

interface PromotionAlias {
  id: string;
  fullName: string;
}
interface Promotion {
  id: string;
  shortName: string;
  fullName: string | null;
  aliases: PromotionAlias[];
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [newShort, setNewShort] = useState("");
  const [newFull, setNewFull] = useState("");
  const [newAlias, setNewAlias] = useState<{ [id: string]: string }>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const fetchPromotions = async () => {
    const res = await fetch("/api/admin/promotions");
    if (res.ok) setPromotions(await res.json());
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleCreate = async () => {
    if (!newShort.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shortName: newShort.trim(),
        fullName: newFull.trim() || null,
      }),
    });
    if (res.ok) {
      setNewShort("");
      setNewFull("");
      setMessage("✅ Promotion created!");
      fetchPromotions();
    } else {
      setMessage("❌ Error creating promotion");
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this promotion and all its aliases?")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    fetchPromotions();
  };

  const handleAddAlias = async (promotionId: string) => {
    const alias = newAlias[promotionId]?.trim();
    if (!alias) return;
    const res = await fetch(`/api/admin/promotions/${promotionId}/aliases`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: alias }),
    });
    if (res.ok) {
      setNewAlias((prev) => ({ ...prev, [promotionId]: "" }));
      fetchPromotions();
    }
  };

  const handleDeleteAlias = async (promotionId: string, aliasId: string) => {
    await fetch(`/api/admin/promotions/${promotionId}/aliases/${aliasId}`, {
      method: "DELETE",
    });
    fetchPromotions();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Promotions</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Map long promotion names from Cagematch (e.g. "World Wrestling
          Entertainment") to short display names (e.g. "WWE").
        </p>
      </div>

      {/* Create New */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
          Add New Promotion
        </h2>
        <div className="flex gap-3 items-end flex-wrap">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
              Short Name (Display)
            </label>
            <input
              className="bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none w-40"
              placeholder="WWE"
              value={newShort}
              onChange={(e) => setNewShort(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
              Full Name (Optional default alias)
            </label>
            <input
              className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
              placeholder="World Wrestling Entertainment"
              value={newFull}
              onChange={(e) => setNewFull(e.target.value)}
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={saving}
            className="btn-primary flex items-center gap-2 h-[44px]"
          >
            <Plus className="w-4 h-4" /> Create
          </button>
        </div>
        {message && (
          <p className="text-sm mt-3 font-medium text-emerald-600">{message}</p>
        )}
      </div>

      {/* Promotions List */}
      <div className="space-y-3">
        {promotions.map((promo) => (
          <div
            key={promo.id}
            className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Tag className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-bold text-sm">{promo.shortName}</p>
                  {promo.fullName && (
                    <p className="text-xs text-muted-foreground">
                      {promo.fullName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {promo.aliases.length} alias
                    {promo.aliases.length !== 1 ? "es" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setExpanded(expanded === promo.id ? null : promo.id)
                  }
                  className="p-2 hover:bg-secondary rounded-lg transition-colors"
                >
                  {expanded === promo.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(promo.id)}
                  className="p-2 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {expanded === promo.id && (
              <div className="border-t border-border px-6 py-4 space-y-3 bg-slate-50">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Cagematch Name Aliases
                </p>
                {promo.aliases.map((alias) => (
                  <div
                    key={alias.id}
                    className="flex items-center justify-between bg-white rounded-xl px-4 py-2 border border-border"
                  >
                    <span className="text-sm font-medium">
                      {alias.fullName}
                    </span>
                    <button
                      onClick={() => handleDeleteAlias(promo.id, alias.id)}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-white border border-border rounded-xl p-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder='e.g. "World Wrestling Entertainment"'
                    value={newAlias[promo.id] || ""}
                    onChange={(e) =>
                      setNewAlias((prev) => ({
                        ...prev,
                        [promo.id]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleAddAlias(promo.id)
                    }
                  />
                  <button
                    onClick={() => handleAddAlias(promo.id)}
                    className="btn-primary text-xs px-4 py-2"
                  >
                    Add Alias
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="bg-white rounded-2xl border border-border p-12 text-center text-muted-foreground text-sm">
            No promotions yet. Add your first promotion above.
          </div>
        )}
      </div>
    </div>
  );
}
