"use client";

import { useState, useEffect } from "react";
import { StickyNote, Save, Loader2, CheckCircle } from "lucide-react";

export default function AdminNotesClient({ initialNotes }: { initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const save = async () => {
    setIsSaving(true);
    try {
      await fetch('/api/admin/config/admin_notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value: notes })
      });
      setLastSaved(new Date());
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative group">
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Write shared admin notes here...&#10;- Verify NXT posters&#10;- Check duplicate wrestlers in AEW&#10;- Sync TMDB keys"
          className="w-full h-80 px-10 py-10 bg-yellow-50/50 border-2 border-dashed border-yellow-200 rounded-[3rem] text-sm focus:outline-none focus:border-primary transition-all font-medium text-slate-800 leading-relaxed shadow-inner"
        />
        <StickyNote className="absolute top-8 left-4 w-4 h-4 text-yellow-400 opacity-20 group-focus-within:opacity-100 transition-opacity" />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            {lastSaved && (
                <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Last saved {lastSaved.toLocaleTimeString()}
                </span>
            )}
        </div>
        <button
          onClick={save}
          disabled={isSaving}
          className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-black uppercase italic tracking-widest rounded-2xl hover:scale-105 transition-all shadow-xl disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {isSaving ? "Saving..." : "Save Notes"}
        </button>
      </div>
    </div>
  );
}
