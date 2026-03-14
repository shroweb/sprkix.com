"use client";

import { useState } from "react";
import { Link2, Play, CheckCircle, XCircle, Loader2, Trash2, ExternalLink } from "lucide-react";

type QueueItem = {
  id: string;
  url: string;
  status: "pending" | "processing" | "done" | "error";
  eventTitle?: string;
  matchCount?: number;
  wrestlersCreated?: number;
  error?: string;
};

export default function ImportQueueClient() {
  const [rawUrls, setRawUrls] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);

  const buildQueue = () => {
    const lines = rawUrls
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const items: QueueItem[] = lines.map((url, i) => ({
      id: `${i}-${url}`,
      url,
      status: "pending",
    }));
    setQueue(items);
  };

  const runQueue = async () => {
    if (running) return;
    setRunning(true);

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      if (item.status !== "pending") continue;

      setQueue((prev) =>
        prev.map((q) => (q.id === item.id ? { ...q, status: "processing" } : q)),
      );

      try {
        const res = await fetch("/api/admin/import-queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: item.url }),
        });
        const data = await res.json();
        if (res.ok) {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: "done",
                    eventTitle: data.eventTitle,
                    matchCount: data.matchCount,
                    wrestlersCreated: data.wrestlersCreated,
                  }
                : q,
            ),
          );
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.id === item.id ? { ...q, status: "error", error: data.error } : q,
            ),
          );
        }
      } catch (e: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.id === item.id ? { ...q, status: "error", error: e.message } : q,
          ),
        );
      }

      // Small delay between requests
      await new Promise((r) => setTimeout(r, 500));
    }

    setRunning(false);
  };

  const pendingCount = queue.filter((q) => q.status === "pending").length;
  const doneCount = queue.filter((q) => q.status === "done").length;
  const errorCount = queue.filter((q) => q.status === "error").length;

  return (
    <div className="space-y-6">
      {/* URL Input */}
      {queue.length === 0 && (
        <div className="bg-white rounded-2xl border border-border p-8 space-y-4">
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground block mb-2">
              Cagematch Event URLs
            </label>
            <textarea
              value={rawUrls}
              onChange={(e) => setRawUrls(e.target.value)}
              rows={10}
              placeholder={`https://www.cagematch.net/?id=1&nr=123456\nhttps://www.cagematch.net/?id=1&nr=789012\n...`}
              className="w-full bg-secondary border-none rounded-xl p-4 text-sm font-mono focus:ring-2 focus:ring-primary outline-none"
            />
            <p className="text-xs text-muted-foreground mt-2">One URL per line. Cagematch event pages only.</p>
          </div>
          <button
            onClick={buildQueue}
            disabled={!rawUrls.trim()}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase italic tracking-wide rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
          >
            <Link2 className="w-4 h-4" />
            Build Queue ({rawUrls.split("\n").filter((l) => l.trim()).length} URLs)
          </button>
        </div>
      )}

      {/* Queue Controls */}
      {queue.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-6 text-sm">
            <span className="font-bold">{queue.length} total</span>
            <span className="text-emerald-600 font-bold">{doneCount} done</span>
            <span className="text-amber-500 font-bold">{pendingCount} pending</span>
            {errorCount > 0 && <span className="text-red-500 font-bold">{errorCount} errors</span>}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => { setQueue([]); setRawUrls(""); }}
              disabled={running}
              className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-sm font-bold hover:bg-border transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
            <button
              onClick={runQueue}
              disabled={running || pendingCount === 0}
              className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-black uppercase italic tracking-wide rounded-xl disabled:opacity-40 hover:bg-primary/90 transition-colors"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? "Importing..." : `Run Queue (${pendingCount})`}
            </button>
          </div>
        </div>
      )}

      {/* Queue Items */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-2xl border p-4 flex items-center gap-4 ${
                item.status === "done"
                  ? "border-emerald-200"
                  : item.status === "error"
                  ? "border-red-200"
                  : item.status === "processing"
                  ? "border-primary/30"
                  : "border-border"
              }`}
            >
              {/* Status icon */}
              <div className="shrink-0">
                {item.status === "done" && <CheckCircle className="w-5 h-5 text-emerald-500" />}
                {item.status === "error" && <XCircle className="w-5 h-5 text-red-500" />}
                {item.status === "processing" && <Loader2 className="w-5 h-5 text-primary animate-spin" />}
                {item.status === "pending" && <div className="w-5 h-5 rounded-full border-2 border-border" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {item.status === "done" ? (
                  <div>
                    <p className="font-bold text-sm truncate">{item.eventTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.matchCount} matches · {item.wrestlersCreated} new wrestlers
                    </p>
                  </div>
                ) : item.status === "error" ? (
                  <div>
                    <p className="text-sm text-red-600 font-bold truncate">{item.error}</p>
                    <p className="text-xs text-muted-foreground font-mono truncate">{item.url}</p>
                  </div>
                ) : (
                  <p className="text-sm font-mono text-muted-foreground truncate">{item.url}</p>
                )}
              </div>

              {/* Link */}
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
