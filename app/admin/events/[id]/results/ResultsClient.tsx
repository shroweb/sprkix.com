"use client";

import { useState } from "react";
import {
  Trophy,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Save,
  Swords,
} from "lucide-react";

type Participant = {
  id: string;
  wrestlerId: string;
  isWinner: boolean | null;
  team: number | null;
  wrestler: { id: string; name: string; imageUrl: string | null };
};

type Match = {
  id: string;
  title: string;
  type: string | null;
  result: string | null;
  participants: Participant[];
};

type MatchWinners = Record<string, Set<string>>; // matchId -> Set of participantIds that won

export default function ResultsClient({
  event,
}: {
  event: { id: string; title: string; matches: Match[] };
}) {
  // Build initial winner state from existing data
  const initial: MatchWinners = {};
  event.matches.forEach((m) => {
    initial[m.id] = new Set(
      m.participants.filter((p) => p.isWinner).map((p) => p.id),
    );
  });

  const [winners, setWinners] = useState<MatchWinners>(initial);
  const [results, setResults] = useState<Record<string, string>>(
    Object.fromEntries(event.matches.map((m) => [m.id, m.result || ""])),
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const toggleWinner = (matchId: string, participantId: string) => {
    setWinners((prev) => {
      const next = new Map(Object.entries(prev));
      const matchWinners = new Set(next.get(matchId) || []);
      if (matchWinners.has(participantId)) {
        matchWinners.delete(participantId);
      } else {
        matchWinners.add(participantId);
      }
      next.set(matchId, matchWinners);
      return Object.fromEntries(next);
    });
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      // Build all PATCH requests
      const patches = event.matches.map((match) =>
        fetch(`/api/admin/events/${event.id}/matches/${match.id}/results`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            result: results[match.id] || null,
            winners: Array.from(winners[match.id] || []),
          }),
        }),
      );
      const responses = await Promise.all(patches);
      const allOk = responses.every((r) => r.ok);
      if (allOk) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError("Some matches failed to save. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Status messages */}
      {saved && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" /> All results saved
          successfully!
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {event.matches.length === 0 ? (
        <div className="bg-white rounded-[2rem] border border-border p-20 text-center">
          <Swords className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-muted-foreground font-bold italic">
            No matches on this event yet.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {event.matches.map((match, idx) => (
            <div
              key={match.id}
              className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden"
            >
              <div className="bg-slate-50 border-b border-border px-6 py-4 flex items-center gap-3">
                <span className="text-[10px] font-black text-muted-foreground bg-slate-200 px-2 py-0.5 rounded">
                  MATCH {idx + 1}
                </span>
                <h3 className="font-black uppercase italic tracking-tighter text-sm flex-1 truncate">
                  {match.title}
                </h3>
                {match.type && (
                  <span className="text-[10px] font-bold text-primary/70 italic shrink-0">
                    {match.type}
                  </span>
                )}
              </div>

              <div className="p-6 space-y-5">
                {/* Participants — click to toggle winner */}
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
                    Select Winner(s)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {match.participants.map((p) => {
                      const isWinner = winners[match.id]?.has(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleWinner(match.id, p.id)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border-2 transition-all text-sm font-bold ${
                            isWinner
                              ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {p.wrestler.imageUrl ? (
                            <img
                              src={p.wrestler.imageUrl}
                              alt={p.wrestler.name}
                              className="w-6 h-6 rounded-full object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">
                              {p.wrestler.name.charAt(0)}
                            </div>
                          )}
                          {p.wrestler.name}
                          {isWinner && (
                            <Trophy className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Result text */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Result / Notes (optional)
                  </label>
                  <input
                    type="text"
                    value={results[match.id]}
                    onChange={(e) =>
                      setResults((prev) => ({
                        ...prev,
                        [match.id]: e.target.value,
                      }))
                    }
                    placeholder={`e.g. "Cody Rhodes pinned CM Punk after a Cross Rhodes"`}
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm font-medium"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sticky save bar */}
      {event.matches.length > 0 && (
        <div className="sticky bottom-6 flex justify-end">
          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="btn-primary flex items-center gap-2 px-8 py-4 shadow-2xl shadow-primary/30 disabled:opacity-50"
          >
            {saving ? (
              <RefreshCcw className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? "Saving..." : `Save All ${event.matches.length} Results`}
          </button>
        </div>
      )}
    </div>
  );
}
