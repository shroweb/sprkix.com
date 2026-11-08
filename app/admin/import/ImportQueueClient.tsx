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
  const [singleUrl, setSingleUrl] = useState("");
  const [singleImporting, setSingleImporting] = useState(false);
  const [singleMsg, setSingleMsg] = useState("");

  const [options, setOptions] = useState({
    importTitleAndDate: true,
    importVenueAndCity: true,
    importPosters: true,
    importMatchCards: true,
    importMatchDurations: true,
    autoCreateWrestlers: true,
    importAttendanceAndNetwork: true,
  });

  const [rawUrls, setRawUrls] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [running, setRunning] = useState(false);

  const toggleOption = (key: keyof typeof options) => {
    setOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSingleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleUrl.trim()) return;
    setSingleImporting(true);
    setSingleMsg("");
    try {
      const res = await fetch("/api/admin/import/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: singleUrl, options }),
      });
      const data = await res.json();
      if (data.event) {
        setSingleMsg(`Successfully imported "${data.event.title}"!`);
        setSingleUrl("");
      } else {
        setSingleMsg(data.error || "Import failed");
      }
    } catch (err: any) {
      setSingleMsg(err.message || "Import failed");
    } finally {
      setSingleImporting(false);
    }
  };

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
          body: JSON.stringify({ url: item.url, options }),
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
      {/* Importer Field Selection Matrix */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 text-white">
        <div>
          <h2 className="text-base font-bold uppercase tracking-tight text-amber-400 italic flex items-center gap-2">
            <Link2 className="w-4 h-4 text-amber-400" /> Importer Field Selection Matrix
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose which elements the importer should scrape, parse, and save into the database.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { key: "importTitleAndDate", label: "Show Title & Date", desc: "Event Name, Air Date, Promotion" },
            { key: "importVenueAndCity", label: "Venue & Location", desc: "Arena Name, City, Country" },
            { key: "importPosters", label: "Posters & Graphics", desc: "TMDB & Cagematch artwork" },
            { key: "importMatchCards", label: "Match Cards & Results", desc: "Participants, Winners, Stipulations" },
            { key: "importMatchDurations", label: "Durations & Star Ratings", desc: "Length in mins & match ratings" },
            { key: "autoCreateWrestlers", label: "Auto-Create Wrestlers", desc: "Insert new wrestler profiles" },
            { key: "importAttendanceAndNetwork", label: "Attendance & Network", desc: "Gate attendance & TV channel" },
          ].map((item) => {
            const isChecked = options[item.key as keyof typeof options];
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => toggleOption(item.key as keyof typeof options)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                  isChecked
                    ? "bg-amber-400/10 border-amber-400/50 text-white"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-white">{item.label}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <div
                  className={`w-4 h-4 rounded mt-0.5 shrink-0 flex items-center justify-center text-[10px] font-bold ${
                    isChecked ? "bg-amber-400 text-slate-950" : "bg-slate-800 text-slate-500"
                  }`}
                >
                  {isChecked ? "✓" : ""}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 1-Click Direct URL Importer */}
      <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-primary" /> Direct Cagematch URL Importer
        </h2>
        <form onSubmit={handleSingleImport} className="flex items-center gap-3">
          <input
            type="url"
            required
            placeholder="https://www.cagematch.net/?id=1&nr=312450"
            value={singleUrl}
            onChange={(e) => setSingleUrl(e.target.value)}
            className="flex-1 bg-slate-50 border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={singleImporting}
            className="px-6 py-2.5 bg-primary text-black font-black uppercase italic tracking-wide rounded-xl shadow hover:opacity-90 transition-opacity flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            {singleImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import Show"}
          </button>
        </form>
        {singleMsg && (
          <p className="text-xs font-bold text-primary italic">{singleMsg}</p>
        )}
      </div>

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
