"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  Trophy,
  Clock,
  Search,
  Save,
  X,
  Users,
  Upload,
  RefreshCcw,
  CheckCircle,
  AlertCircle,
  Image as ImageIcon,
  Pencil,
  Download,
  Link2,
  Sparkles,
  Zap,
} from "lucide-react";
import Link from "next/link";
import MediaPicker from "../../../components/MediaPicker";

/** Convert stored seconds → "MM:SS" for display/editing */
function secsToMmss(secs: number | null | undefined): string {
  if (!secs) return "";
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Parse a "MM:SS", decimal minutes, or plain-minutes string back to seconds for storage */
function mmssToSecs(val: any): number | null {
  if (val === null || val === undefined) return null;
  const sVal = val.toString().trim();
  if (!sVal) return null;

  // Handle MM:SS
  const colonMatch = sVal.match(/^(\d+):(\d+)$/);
  if (colonMatch) return parseInt(colonMatch[1]) * 60 + parseInt(colonMatch[2]);

  // Handle decimal or plain number (treat as minutes)
  const num = parseFloat(sVal);
  return isNaN(num) ? null : Math.round(num * 60);
}

type MessageState = { type: "success" | "error"; text: string } | null;

/** Format a UTC Date as a datetime-local input value in the browser's local timezone */
function toLocalDatetimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventClient({
  event,
  initialMatches,
  wrestlers,
}: {
  event: any;
  initialMatches: any[];
  wrestlers: any[];
}) {
  const [matches, setMatches] = useState(initialMatches);
  const [isAddingMatch, setIsAddingMatch] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  // Event details state
  const [details, setDetails] = useState({
    title: event.title || "",
    slug: event.slug || "",
    date: event.date ? new Date(event.date).toISOString().split("T")[0] : "",
    promotion: event.promotion || "",
    venue: event.venue || "",
    posterUrl: event.posterUrl || "",
    description: event.description || "",
    type: event.type || "ppv",
    // Format as local datetime-local string (YYYY-MM-DDTHH:mm) in the browser's timezone
    startTime: event.startTime ? toLocalDatetimeInput(new Date(event.startTime)) : "",
    endTime: event.endTime ? toLocalDatetimeInput(new Date(event.endTime)) : "",
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  // New Match State
  // Inline match editing state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editingMatchData, setEditingMatchData] = useState<{
    title: string;
    type: string;
    result: string;
    duration: string;
    participants: { wrestlerId: string; team: number; isWinner: boolean }[];
  }>({
    title: "",
    type: "",
    result: "",
    duration: "",
    participants: [],
  });
  const [editingSearch, setEditingSearch] = useState("");
  const [savingMatch, setSavingMatch] = useState(false);

  // Match import state
  const [importUrl, setImportUrl] = useState(event.profightdbUrl || "");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    matchesImported: number;
    wrestlersCreated: number;
    wrestlersMatched: number;
    createdNames: string[];
  } | null>(null);
  const [importError, setImportError] = useState("");

  const handleImportMatches = async () => {
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportResult(null);
    setImportError("");
    try {
      const res = await fetch(`/api/admin/events/${event.id}/import-matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult({
          matchesImported: data.matchesImported ?? 0,
          wrestlersMatched: data.wrestlersMatched ?? 0,
          wrestlersCreated: data.wrestlersCreated ?? 0,
          createdNames: data.createdNames ?? [],
        });
        // API returns the full updated list — replace, don't append
        setMatches(data.matches ?? []);
        showMessage(
          "success",
          `Imported ${data.matchesImported ?? 0} matches successfully!`,
        );
      } else {
        setImportError(data.error || "Import failed");
      }
    } catch {
      setImportError("Network error. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  // New Match State
  const [newMatch, setNewMatch] = useState({
    title: "",
    type: "Singles Match",
    duration: "",
    result: "",
    participants: [] as {
      wrestlerId: string;
      team: number;
      isWinner: boolean;
    }[],
  });
  const [participantSearch, setParticipantSearch] = useState("");

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const filteredWrestlers = wrestlers.filter(
    (w) =>
      w.name.toLowerCase().includes(participantSearch.toLowerCase()) &&
      !newMatch.participants.some((p) => p.wrestlerId === w.id),
  );

  const filteredEditingWrestlers = wrestlers.filter(
    (w) =>
      w.name.toLowerCase().includes(editingSearch.toLowerCase()) &&
      !editingMatchData.participants.some((p) => p.wrestlerId === w.id),
  );

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        setDetails((prev) => ({ ...prev, posterUrl: data.url }));
      } else {
        showMessage("error", "Image upload failed.");
      }
    } catch {
      showMessage("error", "Image upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDetails(true);
    // Convert datetime-local strings to full ISO (with timezone) before sending
    const toISO = (val: string) => {
      if (!val) return "";
      const d = new Date(val);
      return isNaN(d.getTime()) ? "" : d.toISOString();
    };
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...details,
          startTime: toISO(details.startTime),
          endTime: toISO(details.endTime),
        }),
      });
      if (res.ok) {
        showMessage("success", "Event details saved.");
      } else {
        const data = await res.json();
        showMessage("error", data.error || "Failed to save event details.");
      }
    } catch (err: any) {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  };

  const handleAddParticipant = (wrestlerId: string) => {
    setNewMatch((prev) => ({
      ...prev,
      participants: [
        ...prev.participants,
        { wrestlerId, team: 1, isWinner: false },
      ],
    }));
    setParticipantSearch("");
  };

  const handleRemoveParticipant = (wrestlerId: string) => {
    setNewMatch((prev) => ({
      ...prev,
      participants: prev.participants.filter(
        (p) => p.wrestlerId !== wrestlerId,
      ),
    }));
  };

  const handleUpdateParticipant = (
    wrestlerId: string,
    field: string,
    value: any,
  ) => {
    setNewMatch((prev) => ({
      ...prev,
      participants: prev.participants.map((p) =>
        p.wrestlerId === wrestlerId ? { ...p, [field]: value } : p,
      ),
    }));
  };

  const handleSaveMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formattedMatch = {
        ...newMatch,
        duration: mmssToSecs(newMatch.duration),
      };

      const res = await fetch(`/api/admin/events/${event.id}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedMatch),
      });
      if (res.ok) {
        const addedMatch = await res.json();
        setMatches([...matches, addedMatch]);
        setIsAddingMatch(false);
        setNewMatch({
          title: "",
          type: "Singles Match",
          duration: "",
          result: "",
          participants: [],
        });
      } else {
        showMessage("error", "Failed to save match.");
      }
    } catch {
      showMessage("error", "Error saving match.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!confirm("Are you sure you want to delete this match?")) return;
    try {
      const res = await fetch(
        `/api/admin/events/${event.id}/matches/${matchId}`,
        { method: "DELETE" },
      );
      if (res.ok) {
        setMatches(matches.filter((m) => m.id !== matchId));
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleStartEdit = (match: any) => {
    setEditingMatchId(match.id);
    setEditingMatchData({
      title: match.title || "",
      type: match.type || "",
      result: match.result || "",
      duration: match.duration ? secsToMmss(match.duration) : "",
      participants: match.participants.map((p: any) => ({
        wrestlerId: p.wrestlerId,
        team: p.team || 1,
        isWinner: !!p.isWinner,
      })),
    });
  };

  const handleCancelEdit = () => {
    setEditingMatchId(null);
    setEditingMatchData({
      title: "",
      type: "",
      result: "",
      duration: "",
      participants: [],
    });
    setEditingSearch("");
  };

  const handleSaveMatchEdit = async (matchId: string) => {
    setSavingMatch(true);
    try {
      const res = await fetch(
        `/api/admin/events/${event.id}/matches/${matchId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...editingMatchData,
            duration: mmssToSecs(editingMatchData.duration),
          }),
        },
      );
      if (res.ok) {
        const updated = await res.json();
        setMatches(
          matches.map((m) => (m.id === matchId ? { ...m, ...updated } : m)),
        );
        setEditingMatchId(null);
        showMessage("success", "Match updated successfully.");
      } else {
        showMessage("error", "Failed to update match.");
      }
    } catch {
      showMessage("error", "Network error.");
    } finally {
      setSavingMatch(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight uppercase italic">
            {event.title}
          </h1>
          <p className="text-muted-foreground font-medium italic">
            Edit event details and manage the match card.
          </p>
        </div>
        <Link
          href={`/admin/events/${event.id}/results`}
          className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Zap className="w-3.5 h-3.5" /> Quick Results
        </Link>
      </div>

      {message && (
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {/* Event Details */}
      <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-border p-6 flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h2 className="font-black uppercase italic tracking-tighter text-sm">
            Event Details
          </h2>
        </div>
        <form onSubmit={handleSaveDetails} className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Title
                  </label>
                  <input
                    value={details.title}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, title: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Slug
                  </label>
                  <input
                    value={details.slug}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, slug: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Date
                  </label>
                  <input
                    type="date"
                    value={details.date}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, date: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Promotion
                  </label>
                  <input
                    value={details.promotion}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, promotion: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Venue
                  </label>
                  <input
                    value={details.venue}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, venue: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Type
                </label>
                <select
                  value={details.type}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, type: e.target.value }))
                  }
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                >
                  <option value="ppv">PPV / PLE</option>
                  <option value="tv">TV Show</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-primary">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={details.startTime}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, startTime: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 italic">When Countdown ends.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-primary">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    value={details.endTime}
                    onChange={(e) =>
                      setDetails((d) => ({ ...d, endTime: e.target.value }))
                    }
                    className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1 italic">When Chat archives.</p>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Description
                </label>
                <textarea
                  value={details.description}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, description: e.target.value }))
                  }
                  rows={3}
                  className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm font-medium"
                  placeholder="Event description..."
                />
              </div>
            </div>

            {/* Poster */}
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Event Poster
              </label>
              <div className="relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-100">
                {details.posterUrl ? (
                  <img
                    src={details.posterUrl}
                    alt="Poster"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-slate-300" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="cursor-pointer w-full bg-primary text-black py-2.5 rounded-xl text-xs font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  {uploading ? (
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {uploading ? "Uploading..." : "Upload Poster"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setShowMediaPicker(true)}
                  className="w-full bg-slate-100 text-slate-700 py-2.5 rounded-xl text-xs font-black uppercase italic tracking-tighter flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors"
                >
                  <ImageIcon className="w-3 h-3" /> Select from Library
                </button>
                <input
                  type="text"
                  value={details.posterUrl}
                  onChange={(e) =>
                    setDetails((d) => ({ ...d, posterUrl: e.target.value }))
                  }
                  placeholder="Or paste image URL..."
                  className="w-full bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl outline-none focus:border-primary/50 transition-all font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {showMediaPicker && (
            <MediaPicker
              title="Select Event Poster"
              onSelect={(url) => setDetails((d) => ({ ...d, posterUrl: url }))}
              onClose={() => setShowMediaPicker(false)}
            />
          )}

          <div className="flex justify-end mt-8 pt-6 border-t border-border">
            <button
              type="submit"
              disabled={savingDetails || uploading}
              className="btn-primary px-8 py-3 flex items-center gap-2 shadow-xl shadow-primary/20"
            >
              {savingDetails ? (
                <RefreshCcw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {savingDetails ? "Saving..." : "Save Details"}
            </button>
          </div>
        </form>
      </div>

      {/* Import Match Card */}
      <div className="bg-white rounded-[2rem] border border-border shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-border p-6 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <div>
            <h2 className="font-black uppercase italic tracking-tighter text-sm">
              Import Match Card
            </h2>
            <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
              Paste a Cagematch event URL to auto-import all matches and
              wrestlers.
            </p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="url"
                value={importUrl}
                onChange={(e) => {
                  setImportUrl(e.target.value);
                  setImportError("");
                  setImportResult(null);
                }}
                placeholder="https://www.cagematch.net/?id=1&nr=XXXXX"
                className="w-full pl-9 bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-mono text-sm"
              />
            </div>
            <button
              onClick={handleImportMatches}
              disabled={importing || !importUrl.trim()}
              className="btn-primary flex items-center gap-2 px-6 py-3 whitespace-nowrap disabled:opacity-50"
            >
              {importing ? (
                <>
                  <RefreshCcw className="w-4 h-4 animate-spin" /> Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" /> Import Matches
                </>
              )}
            </button>
          </div>

          {importError && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{importError}</span>
            </div>
          )}

          {importResult && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-sm">
                <CheckCircle className="w-4 h-4" />
                Import complete!
              </div>
              <div className="grid grid-cols-3 gap-3 mt-2">
                <div className="bg-white rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-600">
                    {importResult.matchesImported}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                    Matches Added
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-600">
                    {importResult.wrestlersMatched}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                    Wrestlers Matched
                  </p>
                </div>
                <div className="bg-white rounded-xl p-3 text-center border border-emerald-100">
                  <p className="text-2xl font-black text-emerald-600">
                    {importResult.wrestlersCreated}
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">
                    New Wrestlers
                  </p>
                </div>
              </div>
              {importResult.createdNames.length > 0 && (
                <p className="text-xs text-emerald-700 font-medium mt-2">
                  <span className="font-black">New wrestlers created: </span>
                  {importResult.createdNames.join(", ")}
                </p>
              )}
            </div>
          )}

          <p className="text-[11px] text-muted-foreground font-medium">
            <span className="font-black">How it works:</span> Wrestlers are
            matched by name to your existing roster. Any not found are
            automatically added. You can edit match details and results after
            import.
          </p>
        </div>
      </div>

      {/* Match Card Section */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black tracking-tight uppercase italic">
            Match Card
          </h2>
          <p className="text-muted-foreground text-sm font-medium italic">
            {matches.length} matches booked
          </p>
        </div>
        {!isAddingMatch && (
          <button
            onClick={() => setIsAddingMatch(true)}
            className="btn-primary flex items-center gap-2 py-3 px-6 shadow-xl shadow-primary/20"
          >
            <Plus className="w-4 h-4" /> Add Match
          </button>
        )}
      </div>

      {isAddingMatch && (
        <div className="bg-white rounded-[2rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="bg-slate-50 border-b border-border p-6 flex justify-between items-center">
            <h2 className="font-black uppercase italic tracking-tighter flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Create New Match
            </h2>
            <button
              onClick={() => setIsAddingMatch(false)}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveMatch} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Match Title/Stakes
                </label>
                <input
                  required
                  value={newMatch.title}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, title: e.target.value })
                  }
                  placeholder="e.g. Undisputed WWE Championship Match"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Match Type
                </label>
                <input
                  value={newMatch.type}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, type: e.target.value })
                  }
                  placeholder="e.g. Hell in a Cell"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Detailed Result Summary
                </label>
                <input
                  value={newMatch.result}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, result: e.target.value })
                  }
                  placeholder="e.g. Cody Rhodes def. Roman Reigns via Pinfall"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Duration (MM:SS or Minutes)
                </label>
                <input
                  type="text"
                  value={newMatch.duration}
                  onChange={(e) =>
                    setNewMatch({ ...newMatch, duration: e.target.value })
                  }
                  placeholder="e.g. 14 or 14:30"
                  className="w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold"
                />
              </div>
            </div>

            <div className="border border-border rounded-xl overflow-hidden bg-slate-50">
              <div className="p-4 border-b border-border bg-white flex justify-between items-center">
                <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-tight">
                  <Users className="w-4 h-4 text-primary" /> Participants &
                  Teams
                </h3>
                <div className="relative w-64">
                  <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search roster..."
                    value={participantSearch}
                    onChange={(e) => setParticipantSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  {participantSearch && filteredWrestlers.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-50">
                      {filteredWrestlers.map((w) => (
                        <button
                          key={w.id}
                          type="button"
                          onClick={() => handleAddParticipant(w.id)}
                          className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-between group"
                        >
                          {w.name}
                          <Plus className="w-3 h-3 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-2">
                {newMatch.participants.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-xs font-medium italic">
                    Use the search bar above to add wrestlers to this match.
                  </div>
                ) : (
                  newMatch.participants.map((p) => {
                    const w = wrestlers.find((w) => w.id === p.wrestlerId);
                    return (
                      <div
                        key={p.wrestlerId}
                        className="flex items-center gap-4 bg-white p-3 rounded-lg border border-border shadow-sm"
                      >
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                          {w?.imageUrl ? (
                            <img
                              src={w.imageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[10px] font-black">
                              {w?.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-sm tracking-tight">
                            {w?.name}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold uppercase text-muted-foreground">
                              Team #
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={p.team}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  p.wrestlerId,
                                  "team",
                                  parseInt(e.target.value),
                                )
                              }
                              className="w-16 p-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                            />
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                            <input
                              type="checkbox"
                              checked={p.isWinner}
                              onChange={(e) =>
                                handleUpdateParticipant(
                                  p.wrestlerId,
                                  "isWinner",
                                  e.target.checked,
                                )
                              }
                              className="accent-primary w-3 h-3"
                            />
                            <span className="text-xs font-bold uppercase tracking-wide">
                              Winner
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              handleRemoveParticipant(p.wrestlerId)
                            }
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingMatch(false)}
                className="px-6 py-3 font-bold text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-8 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />{" "}
                {saving ? "Saving..." : "Publish Match"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {matches.length === 0 ? (
          <div className="bg-white rounded-3xl border border-border p-16 text-center shadow-sm">
            <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-black uppercase italic tracking-tighter mb-1">
              No Matches Booked
            </h3>
            <p className="text-muted-foreground text-sm italic">
              The card for this event is currently empty.
            </p>
          </div>
        ) : (
          matches.map((match: any) => (
            <div
              key={match.id}
              className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden"
            >
              {editingMatchId === match.id ? (
                /* ── Inline Edit Mode ── */
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-black uppercase italic tracking-tighter text-sm text-primary flex items-center gap-2">
                      <Pencil className="w-4 h-4" /> Editing Match
                    </h3>
                    <button
                      onClick={handleCancelEdit}
                      className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Match Title/Stakes
                      </label>
                      <input
                        value={editingMatchData.title}
                        onChange={(e) =>
                          setEditingMatchData((d) => ({
                            ...d,
                            title: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Match Type
                      </label>
                      <input
                        value={editingMatchData.type}
                        onChange={(e) =>
                          setEditingMatchData((d) => ({
                            ...d,
                            type: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-medium text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Duration (MM:SS or Minutes)
                      </label>
                      <input
                        type="text"
                        value={editingMatchData.duration}
                        onChange={(e) =>
                          setEditingMatchData((d) => ({
                            ...d,
                            duration: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all font-bold text-sm"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        Result Summary
                      </label>
                      <input
                        value={editingMatchData.result}
                        onChange={(e) =>
                          setEditingMatchData((d) => ({
                            ...d,
                            result: e.target.value,
                          }))
                        }
                        className="w-full bg-slate-50 border-2 border-slate-100 p-3 rounded-xl outline-none focus:border-primary/50 focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* Participants (Management in edit mode) */}
                  <div className="border border-border rounded-xl overflow-hidden bg-slate-50 mt-4">
                    <div className="p-3 border-b border-border bg-white flex justify-between items-center">
                      <h3 className="font-bold text-xs flex items-center gap-2 uppercase tracking-tight">
                        <Users className="w-3.5 h-3.5 text-primary" />{" "}
                        Participants
                      </h3>
                      <div className="relative w-48">
                        <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          placeholder="Add wrestler..."
                          value={editingSearch}
                          onChange={(e) => setEditingSearch(e.target.value)}
                          className="w-full pl-8 pr-2 py-1 text-[10px] bg-slate-100 border border-border rounded-lg outline-none focus:ring-1 focus:ring-primary/20"
                        />
                        {editingSearch &&
                          filteredEditingWrestlers.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
                              {filteredEditingWrestlers.map((w) => (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => {
                                    setEditingMatchData((prev) => ({
                                      ...prev,
                                      participants: [
                                        ...prev.participants,
                                        {
                                          wrestlerId: w.id,
                                          team: 1,
                                          isWinner: false,
                                        },
                                      ],
                                    }));
                                    setEditingSearch("");
                                  }}
                                  className="w-full text-left px-3 py-1.5 text-[10px] font-bold hover:bg-slate-50 transition-colors flex items-center justify-between"
                                >
                                  {w.name}
                                  <Plus className="w-2.5 h-2.5 text-emerald-500" />
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5">
                      {editingMatchData.participants.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground text-[10px] italic">
                          No participants.
                        </div>
                      ) : (
                        editingMatchData.participants.map((p) => {
                          const w = wrestlers.find(
                            (wr) => wr.id === p.wrestlerId,
                          );
                          return (
                            <div
                              key={p.wrestlerId}
                              className="flex items-center gap-3 bg-white p-2 rounded-lg border border-border shadow-sm"
                            >
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                                {w?.imageUrl ? (
                                  <img
                                    src={w.imageUrl}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-[8px] font-black">
                                    {w?.name.charAt(0)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-[11px] tracking-tight truncate">
                                  {w?.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold text-muted-foreground">
                                    T#
                                  </span>
                                  <input
                                    type="number"
                                    min="1"
                                    value={p.team}
                                    onChange={(e) => {
                                      setEditingMatchData((prev) => ({
                                        ...prev,
                                        participants: prev.participants.map(
                                          (part) =>
                                            part.wrestlerId === p.wrestlerId
                                              ? {
                                                  ...part,
                                                  team: parseInt(
                                                    e.target.value,
                                                  ),
                                                }
                                              : part,
                                        ),
                                      }));
                                    }}
                                    className="w-10 p-1 text-[10px] bg-slate-50 border border-slate-200 rounded text-center font-bold"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMatchData((prev) => ({
                                      ...prev,
                                      participants: prev.participants.map(
                                        (part) =>
                                          part.wrestlerId === p.wrestlerId
                                            ? {
                                                ...part,
                                                isWinner: !part.isWinner,
                                              }
                                            : part,
                                      ),
                                    }));
                                  }}
                                  className={`p-1 rounded transition-colors ${p.isWinner ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}
                                >
                                  <Trophy className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingMatchData((prev) => ({
                                      ...prev,
                                      participants: prev.participants.filter(
                                        (part) =>
                                          part.wrestlerId !== p.wrestlerId,
                                      ),
                                    }));
                                  }}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-5 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveMatchEdit(match.id)}
                      disabled={savingMatch}
                      className="btn-primary px-6 py-2 flex items-center gap-2 text-sm"
                    >
                      {savingMatch ? (
                        <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Save className="w-3.5 h-3.5" />
                      )}
                      {savingMatch ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              ) : (
                /* ── View Mode ── */
                <div className="p-6 hover:shadow-md transition-shadow group relative">
                  <div className="absolute top-5 right-5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleStartEdit(match)}
                      className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Edit match"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(match.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete match"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-start mb-4 pr-20">
                    <div>
                      <h3 className="font-black italic uppercase tracking-tighter text-xl">
                        {match.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                          {match.type}
                        </span>
                        {match.duration && (
                          <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />{" "}
                            {secsToMmss(match.duration)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm font-medium italic text-muted-foreground mb-4 pl-3 border-l-2 border-primary/30">
                    {match.result || "Result pending"}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {match.participants?.map((p: any) => (
                      <div
                        key={p.wrestler?.id || p.wrestlerId}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 border ${
                          p.isWinner
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="w-4 h-4 rounded-full bg-black/5 overflow-hidden flex items-center justify-center">
                          {p.wrestler?.imageUrl ? (
                            <img
                              src={p.wrestler.imageUrl}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            p.wrestler?.name?.charAt(0) || "?"
                          )}
                        </div>
                        {p.wrestler?.name || "Unknown"}
                        {p.isWinner && <Trophy className="w-3 h-3 ml-1" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
