"use client";

import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Medal } from "lucide-react";

type Holder = {
  id: string;
  user: { id: string; name: string | null; slug: string | null };
  awardedAt: string;
};

type BadgeType = {
  type: string;
  title: string;
  icon: string;
  description: string;
  holders: Holder[];
};

type UserOption = { id: string; name: string | null; slug: string | null };

export default function BadgesAdminPage() {
  const [byType, setByType] = useState<BadgeType[]>([]);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [awardTo, setAwardTo] = useState<Record<string, string>>({});

  const load = () => {
    fetch("/api/admin/badges")
      .then((r) => r.json())
      .then((d) => {
        setByType(d.byType || []);
        setUsers(d.users || []);
        setLoading(false);
      });
  };

  useEffect(load, []);

  const act = async (userId: string, badgeType: string, action: "award" | "revoke") => {
    setBusy(`${action}:${userId}:${badgeType}`);
    setMessage("");
    const res = await fetch("/api/admin/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, badgeType, action }),
    });
    const data = await res.json();
    setMessage(data.error || (action === "award" ? "Badge awarded" : "Badge revoked"));
    setBusy(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Badge Manager</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Award or revoke community badges. Automatic awarding runs nightly via /api/cron/award-badges.
        </p>
      </div>

      {message && (
        <p className="px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-bold">
          {message}
        </p>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {byType.map((bt) => (
          <div key={bt.type} className="bg-white rounded-2xl border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-3">
              <span className="text-2xl">{bt.icon}</span>
              <div>
                <h3 className="font-bold text-sm uppercase italic">{bt.title}</h3>
                <p className="text-[10px] text-muted-foreground">{bt.description}</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <select
                  value={awardTo[bt.type] || ""}
                  onChange={(e) => setAwardTo((s) => ({ ...s, [bt.type]: e.target.value }))}
                  className="flex-1 min-w-0 bg-slate-50 border border-border rounded-lg px-2 py-1.5 text-xs font-bold outline-none focus:border-primary"
                >
                  <option value="">Select user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name ?? u.slug ?? u.id}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => awardTo[bt.type] && act(awardTo[bt.type], bt.type, "award")}
                  disabled={!awardTo[bt.type] || busy !== null}
                  className="p-2 rounded-lg bg-primary text-black hover:opacity-90 disabled:opacity-40"
                  title="Award badge"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {bt.holders.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-3">
                  No holders yet.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-64 overflow-y-auto">
                  {bt.holders.map((h) => (
                    <div key={h.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50">
                      <Medal className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="flex-1 min-w-0 truncate text-xs font-bold">
                        {h.user.name ?? h.user.slug}
                      </span>
                      <button
                        onClick={() => act(h.user.id, bt.type, "revoke")}
                        disabled={busy !== null}
                        className="p-1 text-muted-foreground hover:text-red-500 disabled:opacity-40"
                        title="Revoke badge"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
