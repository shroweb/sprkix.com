"use client";

import { useState } from "react";
import { Plus, List, Loader2, Sparkles } from "lucide-react";

export default function BulkMatchParser({ eventId }: { eventId: string }) {
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState<{ title: string; wrestlers: string[] }[]>([]);
  const [loading, setLoading] = useState(false);

  const parse = () => {
    const lines = text.split('\n').filter(l => l.trim());
    const matches = lines.map(line => {
      // Very basic parser: "A vs B" or "A & B vs C & D"
      const wrestlers = line.split(/\s+vs\s+|\s+&\s+|\s+,\s+/).map(w => w.trim());
      return {
        title: line.trim(),
        wrestlers
      };
    });
    setParsed(matches);
  };

  const save = async () => {
    setLoading(true);
    // In a real app, we'd have a bulk create endpoint. 
    // For now we'll just log or simulate.
    alert(`Ready to create ${parsed.length} matches. (API endpoint pending)`);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste match card here (one per line)...&#10;John Cena vs Randy Orton&#10;The Usos vs New Day & Kevin Owens"
        className="w-full h-48 px-6 py-4 bg-white border border-border rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all font-mono"
      />
      
      <div className="flex gap-3">
        <button
          onClick={parse}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all"
        >
          <Sparkles className="w-4 h-4" /> Parse Card
        </button>
        {parsed.length > 0 && (
          <button
            onClick={save}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase italic tracking-widest rounded-xl hover:scale-105 transition-all"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Save {parsed.length} Matches
          </button>
        )}
      </div>

      {parsed.length > 0 && (
        <div className="bg-slate-50 border border-border rounded-3xl p-6 space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">Preview</p>
          {parsed.map((p, i) => (
            <div key={i} className="flex flex-col gap-1">
              <p className="text-sm font-bold">{p.title}</p>
              <div className="flex gap-2 flex-wrap">
                {p.wrestlers.map(w => (
                  <span key={w} className="text-[9px] bg-white border border-border px-2 py-0.5 rounded-full font-black uppercase tracking-widest text-primary">
                    {w}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
