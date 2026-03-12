"use client";

import { useState } from "react";
import { Search, Loader2, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function ImageHealthClient({ events, wrestlers }: { events: any[], wrestlers: any[] }) {
  const [results, setResults] = useState<{ id: string, name: string, type: string, url: string, status: 'checking' | 'ok' | 'broken' }[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  const scan = async () => {
    setIsScanning(true);
    const items = [
      ...events.filter(e => e.posterUrl).map(e => ({ id: e.id, name: e.title, type: 'Event Poster', url: e.posterUrl })),
      ...wrestlers.filter(w => w.imageUrl).map(w => ({ id: w.id, name: w.name, type: 'Wrestler Image', url: w.imageUrl }))
    ];

    setResults(items.map(i => ({ ...i, status: 'checking' as const })));

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      try {
        const res = await fetch(item.url, { method: 'HEAD', mode: 'no-cors' });
        // Since we are using no-cors for remote images (TMDB etc), we can't always check perfectly
        // but for local images it works.
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'ok' } : r));
      } catch (e) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'broken' } : r));
      }
    }
    setIsScanning(false);
  };

  const broken = results.filter(r => r.status === 'broken');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <button
            onClick={scan}
            disabled={isScanning}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isScanning ? "Scanning..." : "Start Health Check"}
          </button>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 text-xs font-bold">
            {results.filter(r => r.status === 'ok').length} healthy
          </div>
          <div className="px-4 py-2 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs font-bold">
            {broken.length} broken
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border max-h-[70vh] overflow-y-auto">
          {results.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="font-bold italic">No scan performed yet.</p>
            </div>
          )}
          {results.map((r, i) => (
            <div key={`${r.type}-${r.id}-${i}`} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{r.name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">{r.type}</p>
                <p className="text-[10px] text-muted-foreground truncate opacity-50">{r.url}</p>
              </div>
              <div>
                {r.status === 'checking' && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
                {r.status === 'ok' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                {r.status === 'broken' && (
                  <div className="flex items-center gap-2 text-red-500">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase">Broken</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
