"use client";

import { useState } from "react";
import { Send, Loader2, Megaphone } from "lucide-react";

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ notificationsCreated: number; pushSent: number; totalUsers: number } | null>(null);
  const [error, setError] = useState("");

  const send = async () => {
    if (!title.trim()) return;
    setSending(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, link }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
      else setError(data.error || "Broadcast failed");
    } catch {
      setError("Network error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-black tracking-tight uppercase italic">Broadcast</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Send an in-app notification (and push) to every user on the platform.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New event added!"
            className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="Details for the notification…"
            className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-primary resize-none"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Link <span className="normal-case font-medium opacity-60">(optional, e.g. /events/slug)</span>
          </label>
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="/events/…"
            className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary"
          />
        </div>

        {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
        {result && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-xs text-emerald-700 space-y-1">
            <p className="font-black">Broadcast sent ✅</p>
            <p>{result.notificationsCreated} in-app notifications · {result.pushSent} pushes · {result.totalUsers} total users</p>
          </div>
        )}

        <button
          onClick={send}
          disabled={sending || !title.trim()}
          className="w-full flex items-center justify-center gap-2 bg-primary text-black py-3.5 rounded-xl text-sm font-black uppercase italic tracking-widest hover:opacity-90 disabled:opacity-40"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Broadcast
        </button>
      </div>

      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <Megaphone className="w-4 h-4 shrink-0 mt-0.5" />
        <p>This is irreversible — every user receives the notification immediately. Use for important announcements only.</p>
      </div>
    </div>
  );
}
