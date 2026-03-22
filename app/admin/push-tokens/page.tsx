"use client";

import { useState, useEffect } from "react";
import { Loader2, Trash2, Smartphone } from "lucide-react";

type PushToken = {
  id: string;
  token: string;
  platform: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string; slug: string | null };
};

export default function PushTokensPage() {
  const [tokens, setTokens] = useState<PushToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/push-tokens")
      .then((r) => r.json())
      .then((d) => { setTokens(d.tokens || []); setLoading(false); });
  }, []);

  const deleteToken = async (token: string) => {
    setDeleting(token);
    await fetch(`/api/admin/push-tokens?token=${encodeURIComponent(token)}`, { method: "DELETE" });
    setTokens((prev) => prev.filter((t) => t.token !== token));
    setDeleting(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Push Tokens</h1>
        <p className="text-muted-foreground text-sm mt-1">{tokens.length} registered device{tokens.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="py-16 text-center">
            <Smartphone className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground font-bold italic">No push tokens registered yet.</p>
            <p className="text-xs text-muted-foreground mt-1">Tokens are saved when users open the mobile app.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {tokens.map((t) => (
              <div key={t.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm">{t.user.name ?? "Unnamed"}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${t.platform === "ios" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}>
                      {t.platform}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{t.user.email}</p>
                  <p className="text-[10px] font-mono text-muted-foreground truncate mt-0.5">{t.token}</p>
                </div>
                <div className="hidden sm:block text-[11px] text-muted-foreground shrink-0 w-24 text-right">
                  {new Date(t.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" })}
                </div>
                <button
                  onClick={() => deleteToken(t.token)}
                  disabled={deleting === t.token}
                  className="p-2 hover:bg-red-50 hover:text-red-500 rounded-xl transition-colors text-muted-foreground disabled:opacity-50"
                >
                  {deleting === t.token ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
