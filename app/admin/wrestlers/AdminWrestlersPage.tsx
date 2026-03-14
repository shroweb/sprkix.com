"use client";
import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  User,
  Link as LinkIcon,
  Camera,
  X,
  Save,
  CheckCircle,
  AlertCircle,
  ImageIcon,
  Upload,
  Film,
  Loader2,
  Zap,
  SkipForward,
  GitMerge,
} from "lucide-react";
import MediaPicker from "../components/MediaPicker";

type Wrestler = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  imageUrl?: string | null;
};

type TmdbResult = {
  id: number;
  name: string;
  known_for_department: string;
  imageUrl: string | null;
};

type BulkMatch = {
  wrestlerId: string;
  wrestlerName: string;
  tmdbId: number | null;
  tmdbName: string | null;
  imageUrl: string | null;
  bio: string | null;
  accepted: boolean; // user toggle
};

function WrestlerMergeModal({
  wrestlers,
  onClose,
  onMerged,
}: {
  wrestlers: Wrestler[];
  onClose: () => void;
  onMerged: (keepId: string, mergeId: string) => void;
}) {
  const [keepQuery, setKeepQuery] = useState("");
  const [mergeQuery, setMergeQuery] = useState("");
  const [keepOpen, setKeepOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [keepWrestler, setKeepWrestler] = useState<Wrestler | null>(null);
  const [mergeWrestler, setMergeWrestler] = useState<Wrestler | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keepRef = useRef<HTMLDivElement>(null);
  const mergeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (keepRef.current && !keepRef.current.contains(e.target as Node)) setKeepOpen(false);
      if (mergeRef.current && !mergeRef.current.contains(e.target as Node)) setMergeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const keepFiltered = keepQuery.trim()
    ? wrestlers.filter(
        (w) =>
          w.name.toLowerCase().includes(keepQuery.toLowerCase()) &&
          w.id !== mergeWrestler?.id,
      )
    : [];

  const mergeFiltered = mergeQuery.trim()
    ? wrestlers.filter(
        (w) =>
          w.name.toLowerCase().includes(mergeQuery.toLowerCase()) &&
          w.id !== keepWrestler?.id,
      )
    : [];

  const handleConfirm = async () => {
    if (!keepWrestler || !mergeWrestler) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/wrestlers/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keepId: keepWrestler.id, mergeId: mergeWrestler.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(`Merged "${data.removed}" into "${data.kept}" successfully.`);
        onMerged(keepWrestler.id, mergeWrestler.id);
      } else {
        setError(data.error || "Merge failed.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
              <GitMerge className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h2 className="font-bold text-base">Merge Wrestlers</h2>
              <p className="text-xs text-muted-foreground">Combine two wrestler records into one</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Keep input */}
          <div ref={keepRef} className="relative">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
              Keep (primary)
            </label>
            <input
              type="text"
              value={keepWrestler ? keepWrestler.name : keepQuery}
              onChange={(e) => {
                setKeepQuery(e.target.value);
                setKeepWrestler(null);
                setKeepOpen(true);
              }}
              onFocus={() => setKeepOpen(true)}
              placeholder="Search for wrestler to keep..."
              className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            {keepOpen && keepFiltered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-2xl shadow-xl z-10 max-h-52 overflow-y-auto">
                {keepFiltered.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setKeepWrestler(w);
                      setKeepQuery(w.name);
                      setKeepOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                      {w.imageUrl ? (
                        <img src={w.imageUrl} alt={w.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-bold truncate">{w.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Merge input */}
          <div ref={mergeRef} className="relative">
            <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
              Remove (will be deleted)
            </label>
            <input
              type="text"
              value={mergeWrestler ? mergeWrestler.name : mergeQuery}
              onChange={(e) => {
                setMergeQuery(e.target.value);
                setMergeWrestler(null);
                setMergeOpen(true);
              }}
              onFocus={() => setMergeOpen(true)}
              placeholder="Search for wrestler to remove..."
              className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
            />
            {mergeOpen && mergeFiltered.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-2xl shadow-xl z-10 max-h-52 overflow-y-auto">
                {mergeFiltered.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      setMergeWrestler(w);
                      setMergeQuery(w.name);
                      setMergeOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                      {w.imageUrl ? (
                        <img src={w.imageUrl} alt={w.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-bold truncate">{w.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Confirmation card */}
          {keepWrestler && mergeWrestler && (
            <div className="bg-purple-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-purple-400 mb-0.5">Keep</p>
                  <div className="flex items-center gap-2">
                    {keepWrestler.imageUrl && (
                      <img src={keepWrestler.imageUrl} alt={keepWrestler.name} className="w-6 h-6 rounded-lg object-cover shrink-0" />
                    )}
                    <p className="font-bold text-purple-900 truncate">{keepWrestler.name}</p>
                  </div>
                </div>
                <GitMerge className="w-4 h-4 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-0.5">Remove</p>
                  <div className="flex items-center gap-2">
                    {mergeWrestler.imageUrl && (
                      <img src={mergeWrestler.imageUrl} alt={mergeWrestler.name} className="w-6 h-6 rounded-lg object-cover shrink-0" />
                    )}
                    <p className="font-bold text-red-700 truncate">{mergeWrestler.name}</p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-purple-700 font-medium">
                This will permanently delete <strong>{mergeWrestler.name}</strong> and merge their match history into <strong>{keepWrestler.name}</strong>.
              </p>
            </div>
          )}

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          {result && <p className="text-xs text-emerald-600 font-bold">{result}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={!keepWrestler || !mergeWrestler || submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white font-bold rounded-xl disabled:opacity-40 hover:bg-purple-700 transition-colors text-sm"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Merging…</>
            ) : (
              <><GitMerge className="w-4 h-4" /> Confirm Merge</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function BulkTmdbModal({
  wrestlers,
  onClose,
  onApplied,
}: {
  wrestlers: Wrestler[];
  onClose: () => void;
  onApplied: (updated: { id: string; imageUrl: string | null; bio: string | null }[]) => void;
}) {
  const [phase, setPhase] = useState<"idle" | "searching" | "review" | "saving" | "done">("idle");
  const [matches, setMatches] = useState<BulkMatch[]>([]);
  const [progress, setProgress] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Only target wrestlers without an image
  const targets = wrestlers.filter((w) => !w.imageUrl);

  const runSearch = async () => {
    if (targets.length === 0) return;
    setPhase("searching");
    setProgress(0);
    setError(null);

    // Split into batches of 10 to show incremental progress
    const BATCH = 10;
    const allMatches: BulkMatch[] = [];
    for (let i = 0; i < targets.length; i += BATCH) {
      const batch = targets.slice(i, i + BATCH);
      try {
        const res = await fetch("/api/admin/tmdb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ wrestlers: batch.map((w) => ({ id: w.id, name: w.name })) }),
        });
        const data = await res.json();
        for (const m of data.matches || []) {
          allMatches.push({ ...m, accepted: !!m.imageUrl });
        }
      } catch {
        // push nulls for this batch
        for (const w of batch) {
          allMatches.push({ wrestlerId: w.id, wrestlerName: w.name, tmdbId: null, tmdbName: null, imageUrl: null, bio: null, accepted: false });
        }
      }
      setProgress(Math.min(i + BATCH, targets.length));
    }
    setMatches(allMatches);
    setPhase("review");
  };

  const toggle = (wrestlerId: string) => {
    setMatches((prev) =>
      prev.map((m) => (m.wrestlerId === wrestlerId ? { ...m, accepted: !m.accepted } : m)),
    );
  };

  const applySelected = async () => {
    const toSave = matches.filter((m) => m.accepted && m.imageUrl);
    if (toSave.length === 0) return;
    setPhase("saving");
    try {
      const res = await fetch("/api/admin/wrestlers/bulk-update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: toSave.map((m) => ({ id: m.wrestlerId, imageUrl: m.imageUrl, bio: m.bio })),
        }),
      });
      const data = await res.json();
      setSavedCount(data.saved ?? 0);
      onApplied(toSave.map((m) => ({ id: m.wrestlerId, imageUrl: m.imageUrl, bio: m.bio })));
      setPhase("done");
    } catch {
      setError("Save failed. Please try again.");
      setPhase("review");
    }
  };

  const accepted = matches.filter((m) => m.accepted).length;
  const noMatch = matches.filter((m) => !m.imageUrl).length;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-bold text-base">Bulk TMDB Match</h2>
              <p className="text-xs text-muted-foreground">{targets.length} wrestlers without a photo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {phase === "idle" && (
            <div className="text-center py-10 space-y-4">
              <Film className="w-12 h-12 text-blue-200 mx-auto" />
              <div>
                <p className="font-bold text-base">Auto-match {targets.length} wrestlers to TMDB</p>
                <p className="text-sm text-muted-foreground mt-1">
                  We'll search TMDB for each wrestler, pick the top result, and let you review before saving.
                </p>
              </div>
              {targets.length === 0 ? (
                <p className="text-sm text-emerald-600 font-bold">All wrestlers already have photos!</p>
              ) : (
                <button onClick={runSearch} className="btn-primary px-8 mx-auto flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Start Matching
                </button>
              )}
            </div>
          )}

          {phase === "searching" && (
            <div className="text-center py-10 space-y-5">
              <Loader2 className="w-10 h-10 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="font-bold">Searching TMDB...</p>
                <p className="text-sm text-muted-foreground mt-1">{progress} / {targets.length} complete</p>
              </div>
              <div className="max-w-xs mx-auto h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(progress / targets.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {(phase === "review" || phase === "saving") && (
            <div className="space-y-3">
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4">
                <span className="text-emerald-600">{accepted} selected</span>
                <span>·</span>
                <span className="text-red-400">{noMatch} no match</span>
                <span>·</span>
                <span>{matches.length} total</span>
              </div>
              {matches.map((m) => (
                <div
                  key={m.wrestlerId}
                  className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${
                    m.accepted ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-slate-50"
                  }`}
                >
                  {/* Wrestler */}
                  <div className="w-36 shrink-0">
                    <p className="text-xs font-bold truncate">{m.wrestlerName}</p>
                    <p className="text-[10px] text-muted-foreground">No photo</p>
                  </div>

                  {/* Arrow */}
                  <div className="text-muted-foreground shrink-0">→</div>

                  {/* TMDB match */}
                  {m.imageUrl ? (
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <img src={m.imageUrl} alt={m.tmdbName ?? ""} className="w-9 h-12 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{m.tmdbName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{m.bio ? m.bio.slice(0, 60) + "…" : "No bio"}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 flex-1 text-muted-foreground">
                      <SkipForward className="w-4 h-4 shrink-0" />
                      <span className="text-xs">No TMDB match found</span>
                    </div>
                  )}

                  {/* Toggle */}
                  {m.imageUrl && (
                    <button
                      type="button"
                      onClick={() => toggle(m.wrestlerId)}
                      className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        m.accepted ? "bg-emerald-500 text-white" : "bg-secondary text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {m.accepted ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </button>
                  )}
                </div>
              ))}
              {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
            </div>
          )}

          {phase === "done" && (
            <div className="text-center py-10 space-y-4">
              <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
              <div>
                <p className="font-bold text-base">Done! {savedCount} wrestlers updated.</p>
                <p className="text-sm text-muted-foreground mt-1">Photos and bios have been saved.</p>
              </div>
              <button onClick={onClose} className="btn-primary px-8 mx-auto">Close</button>
            </div>
          )}
        </div>

        {/* Footer */}
        {(phase === "review" || phase === "saving") && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button
              onClick={applySelected}
              disabled={accepted === 0 || phase === "saving"}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {phase === "saving" ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
              ) : (
                <><CheckCircle className="w-4 h-4" /> Apply {accepted} Match{accepted !== 1 ? "es" : ""}</>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TmdbSearchButton({
  seedName,
  onSelect,
}: {
  seedName: string;
  onSelect: (imageUrl: string, bio: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(seedName);
  const [results, setResults] = useState<TmdbResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch(`/api/admin/tmdb?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  };

  const pick = async (r: TmdbResult) => {
    setSelecting(r.id);
    try {
      const res = await fetch(`/api/admin/tmdb?id=${r.id}`);
      const detail = await res.json();
      onSelect(detail.imageUrl || r.imageUrl || "", detail.bio || "");
      setOpen(false);
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => { setOpen(!open); if (!open && results.length === 0) search(); }}
        className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-2 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"
      >
        <Film className="w-3.5 h-3.5" /> Search TMDB
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-border rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 border-b border-border flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search TMDB people..."
              className="flex-1 bg-secondary rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <button
              type="button"
              onClick={search}
              disabled={loading}
              className="bg-primary text-black px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            </button>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {results.length === 0 && !loading && (
              <p className="text-xs text-muted-foreground text-center p-6">No results yet</p>
            )}
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => pick(r)}
                disabled={selecting === r.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
              >
                <div className="w-9 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  {r.imageUrl ? (
                    <img src={r.imageUrl} alt={r.name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground m-auto mt-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate">{r.name}</p>
                  <p className="text-[10px] text-muted-foreground">{r.known_for_department}</p>
                </div>
                {selecting === r.id && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type MessageState = { type: "success" | "error"; text: string } | null;

export default function AdminWrestlersPage({
  initialWrestlers,
}: {
  initialWrestlers: Wrestler[];
}) {
  const [wrestlers, setWrestlers] = useState(initialWrestlers);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [submitting, setSubmitting] = useState(false);

  // Controlled image + bio state for both forms
  const [addImageUrl, setAddImageUrl] = useState("");
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addBio, setAddBio] = useState("");
  const [addName, setAddName] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editBio, setEditBio] = useState("");
  const [editAliases, setEditAliases] = useState<{ id: string; alias: string }[]>([]);
  const [newAlias, setNewAlias] = useState("");
  const [aliasLoading, setAliasLoading] = useState(false);

  // Media picker state
  const [mediaPickerTarget, setMediaPickerTarget] = useState<
    "add" | "edit" | null
  >(null);
  const [bulkTmdbOpen, setBulkTmdbOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);
  const [fixingSlugs, setFixingSlugs] = useState(false);

  const filteredWrestlers = wrestlers.filter(
    (w) =>
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  // Auto-generate slug from name
  const slugify = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const buildFormData = (
    form: HTMLFormElement,
    imageUrl: string,
    imageFile: File | null,
  ) => {
    const formData = new FormData(form);
    // Remove any existing image entries to avoid conflict
    formData.delete("image");
    formData.delete("imageUrl");
    if (imageFile) {
      formData.append("image", imageFile);
    } else if (imageUrl) {
      formData.append("imageUrl", imageUrl);
    } else {
      // Explicitly signal to the API to clear the image
      formData.append("clearImage", "true");
    }
    return formData;
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = buildFormData(e.currentTarget, addImageUrl, addImageFile);
    try {
      const res = await fetch("/api/admin/add-wrestler", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.wrestler) {
        setWrestlers((prev) =>
          [...prev, data.wrestler].sort((a, b) => a.name.localeCompare(b.name)),
        );
        setIsAdding(false);
        setAddImageUrl("");
        setAddImageFile(null);
        setAddBio("");
        setAddName("");
        showMessage("success", `${data.wrestler.name} added to the roster.`);
        (e.target as HTMLFormElement).reset();
      } else {
        showMessage("error", data.error || "Failed to add wrestler.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (
    e: React.FormEvent<HTMLFormElement>,
    id: string,
  ) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = buildFormData(
      e.currentTarget,
      editImageUrl,
      editImageFile,
    );
    try {
      const res = await fetch(`/api/admin/wrestlers/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setWrestlers((prev) =>
          prev.map((w) => (w.id === id ? { ...w, ...data } : w)),
        );
        setEditingId(null);
        setEditImageUrl("");
        setEditImageFile(null);
        setEditBio("");
        showMessage("success", `${data.name} updated.`);
      } else {
        showMessage("error", data.error || "Failed to update wrestler.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (w: Wrestler) => {
    if (!confirm(`Delete ${w.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/wrestlers/${w.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setWrestlers((prev) => prev.filter((x) => x.id !== w.id));
        showMessage("success", `${w.name} removed from the roster.`);
      } else {
        showMessage("error", "Failed to delete wrestler.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    }
  };

  const openEdit = async (w: Wrestler) => {
    setEditingId(w.id);
    setEditImageUrl(w.imageUrl || "");
    setEditImageFile(null);
    setEditBio(w.bio || "");
    setIsAdding(false);
    setNewAlias("");
    // Load aliases
    try {
      const res = await fetch(`/api/admin/wrestlers/${w.id}/aliases`);
      const data = await res.json();
      setEditAliases(data.aliases || []);
    } catch {
      setEditAliases([]);
    }
  };

  const addAlias = async () => {
    if (!newAlias.trim() || !editingId) return;
    setAliasLoading(true);
    try {
      const res = await fetch(`/api/admin/wrestlers/${editingId}/aliases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alias: newAlias.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        setEditAliases((prev) => [...prev, data.alias]);
        setNewAlias("");
      }
    } finally {
      setAliasLoading(false);
    }
  };

  const removeAlias = async (aliasId: string) => {
    if (!editingId) return;
    await fetch(`/api/admin/wrestlers/${editingId}/aliases`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ aliasId }),
    });
    setEditAliases((prev) => prev.filter((a) => a.id !== aliasId));
  };

  const editingWrestler = wrestlers.find((w) => w.id === editingId);

  // Shared image picker section component
  const ImagePickerSection = ({
    currentUrl,
    currentFile,
    onFileChange,
    onPickerOpen,
    onUrlChange,
    label = "Profile Photo",
  }: {
    currentUrl: string;
    currentFile: File | null;
    onFileChange: (f: File | null) => void;
    onPickerOpen: () => void;
    onUrlChange: (url: string) => void;
    label?: string;
  }) => {
    const previewSrc = currentFile
      ? URL.createObjectURL(currentFile)
      : currentUrl || null;
    return (
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
          {label}
        </label>
        <div className="flex items-start gap-4">
          {/* Preview */}
          <div className="w-20 h-20 rounded-2xl bg-secondary border-2 border-dashed border-border overflow-hidden flex items-center justify-center shrink-0">
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            {/* Buttons */}
            <div className="flex gap-2 flex-wrap">
              <label className="cursor-pointer flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted transition-colors">
                <Upload className="w-3.5 h-3.5" /> Upload File
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0] || null;
                    onFileChange(f);
                    if (f) onUrlChange(""); // clear URL if file chosen
                  }}
                />
              </label>
              <button
                type="button"
                onClick={onPickerOpen}
                className="flex items-center gap-1.5 bg-secondary px-3 py-2 rounded-xl text-xs font-bold hover:bg-muted transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" /> From Library
              </button>
              {(currentUrl || currentFile) && (
                <button
                  type="button"
                  onClick={() => {
                    onFileChange(null);
                    onUrlChange("");
                  }}
                  className="flex items-center gap-1.5 bg-red-50 text-red-500 px-3 py-2 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
            </div>
            {/* URL input */}
            <input
              type="text"
              placeholder="Or paste image URL..."
              value={currentUrl}
              onChange={(e) => {
                onUrlChange(e.target.value);
                onFileChange(null);
              }}
              className="w-full bg-secondary border-none rounded-xl p-2.5 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
            />
            {currentFile && (
              <p className="text-[10px] text-primary font-bold truncate">
                📎 {currentFile.name}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Wrestlers</h1>
          <p className="text-muted-foreground text-sm">
            Manage the competitive roster.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              if (!confirm("This will rename all wrestlers with timestamp slugs (e.g. arashi-1773411326104) to clean slugs. Continue?")) return;
              setFixingSlugs(true);
              try {
                const res = await fetch("/api/admin/wrestlers/fix-slugs", { method: "POST" });
                const data = await res.json();
                setWrestlers((prev) =>
                  prev.map((w) => {
                    const fix = data.results?.find((r: any) => r.id === w.id);
                    return fix ? { ...w, slug: fix.newSlug } : w;
                  }),
                );
                showMessage("success", `Fixed ${data.fixed} slug${data.fixed !== 1 ? "s" : ""}.`);
              } catch {
                showMessage("error", "Slug fix failed.");
              } finally {
                setFixingSlugs(false);
              }
            }}
            disabled={fixingSlugs}
            className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-xl text-sm font-bold hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {fixingSlugs ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />} Fix Slugs
          </button>
          <button
            onClick={() => setBulkTmdbOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors"
          >
            <Zap className="w-4 h-4" /> Bulk TMDB
          </button>
          <button
            onClick={() => setMergeOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-xl text-sm font-bold hover:bg-purple-100 transition-colors"
          >
            <GitMerge className="w-4 h-4" /> Merge
          </button>
          <button
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingId(null);
            }}
            className="btn-primary flex items-center gap-2"
          >
            {isAdding ? (
              <>
                <X className="w-4 h-4" /> Cancel
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Add Wrestler
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline message */}
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

      {/* Add Form */}
      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl">
          <h2 className="text-lg font-bold mb-6">Register New Wrestler</h2>
          <form onSubmit={handleAdd} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Full Name
                </label>
                <input
                  name="name"
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Cody Rhodes"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Slug / URL Alias
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="slug"
                    className="w-full pl-10 pr-4 py-3 bg-secondary border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                    placeholder="cody-rhodes"
                    required
                  />
                </div>
              </div>
            </div>
            <ImagePickerSection
              label="Profile Photo"
              currentUrl={addImageUrl}
              currentFile={addImageFile}
              onFileChange={setAddImageFile}
              onUrlChange={setAddImageUrl}
              onPickerOpen={() => setMediaPickerTarget("add")}
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Biography
                </label>
                <TmdbSearchButton
                  seedName={addName}
                  onSelect={(imageUrl, bio) => {
                    if (imageUrl) { setAddImageUrl(imageUrl); setAddImageFile(null); }
                    if (bio) setAddBio(bio);
                  }}
                />
              </div>
              <textarea
                name="bio"
                value={addBio}
                onChange={(e) => setAddBio(e.target.value)}
                className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={4}
                placeholder="Career history, championships, and notable achievements..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary"
              >
                Discard
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-8"
              >
                {submitting ? "Adding..." : "Register Wrestler"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Form */}
      {editingId && editingWrestler && (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Edit: {editingWrestler.name}</h2>
            <button
              onClick={() => setEditingId(null)}
              className="p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <form
            onSubmit={(e) => handleEdit(e, editingId)}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Full Name
                </label>
                <input
                  name="name"
                  defaultValue={editingWrestler.name}
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Slug / URL Alias
                </label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    name="slug"
                    defaultValue={editingWrestler.slug}
                    className="w-full pl-10 pr-4 py-3 bg-secondary border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
            </div>
            <ImagePickerSection
              label="Profile Photo"
              currentUrl={editImageUrl}
              currentFile={editImageFile}
              onFileChange={setEditImageFile}
              onUrlChange={setEditImageUrl}
              onPickerOpen={() => setMediaPickerTarget("edit")}
            />
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-muted-foreground uppercase">
                  Biography
                </label>
                <TmdbSearchButton
                  seedName={editingWrestler.name}
                  onSelect={(imageUrl, bio) => {
                    if (imageUrl) { setEditImageUrl(imageUrl); setEditImageFile(null); }
                    if (bio) setEditBio(bio);
                  }}
                />
              </div>
              <textarea
                name="bio"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                rows={4}
              />
            </div>
            {/* Alternative Names / Aliases */}
            <div>
              <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block">
                Alternative Names
              </label>
              <div className="space-y-2">
                {editAliases.map((a) => (
                  <div key={a.id} className="flex items-center justify-between bg-secondary rounded-xl px-3 py-2 text-sm">
                    <span>{a.alias}</span>
                    <button type="button" onClick={() => removeAlias(a.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Dean Ambrose"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAlias(); } }}
                    className="flex-1 bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAlias}
                    disabled={aliasLoading || !newAlias.trim()}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                  >
                    {aliasLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary px-8 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Roster Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find wrestler by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground tracking-wide">
            {filteredWrestlers.length} Roster Members
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
          {filteredWrestlers.map((w) => (
            <div
              key={w.id}
              className={`bg-white p-4 flex items-center justify-between group hover:bg-slate-50 transition-colors ${editingId === w.id ? "bg-primary/5" : ""}`}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl border border-border overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                  {w.imageUrl ? (
                    <img
                      src={w.imageUrl}
                      alt={w.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{w.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                    /{w.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() =>
                    editingId === w.id ? setEditingId(null) : openEdit(w)
                  }
                  className={`p-2 rounded-lg transition-colors ${editingId === w.id ? "bg-primary/10 text-primary" : "hover:bg-amber-50 text-amber-600"}`}
                  title="Edit wrestler"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(w)}
                  className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                  title="Delete wrestler"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredWrestlers.length === 0 && (
          <div className="p-20 text-center">
            <User className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-muted-foreground font-medium">
              No wrestlers found in current roster.
            </p>
          </div>
        )}
      </div>

      {/* Bulk TMDB Modal */}
      {bulkTmdbOpen && (
        <BulkTmdbModal
          wrestlers={wrestlers}
          onClose={() => setBulkTmdbOpen(false)}
          onApplied={(updates) => {
            setWrestlers((prev) =>
              prev.map((w) => {
                const u = updates.find((x) => x.id === w.id);
                return u ? { ...w, imageUrl: u.imageUrl ?? w.imageUrl, bio: u.bio ?? w.bio } : w;
              }),
            );
            setBulkTmdbOpen(false);
            showMessage("success", `${updates.length} wrestlers updated from TMDB.`);
          }}
        />
      )}

      {/* Wrestler Merge Modal */}
      {mergeOpen && (
        <WrestlerMergeModal
          wrestlers={wrestlers}
          onClose={() => setMergeOpen(false)}
          onMerged={(keepId, mergeId) => {
            setWrestlers((prev) => prev.filter((w) => w.id !== mergeId));
            setMergeOpen(false);
            showMessage("success", "Wrestlers merged successfully.");
          }}
        />
      )}

      {/* Media Picker Modal */}
      {mediaPickerTarget && (
        <MediaPicker
          title="Select Profile Photo"
          onSelect={(url) => {
            if (mediaPickerTarget === "add") {
              setAddImageUrl(url);
              setAddImageFile(null);
            } else {
              setEditImageUrl(url);
              setEditImageFile(null);
            }
          }}
          onClose={() => setMediaPickerTarget(null)}
        />
      )}
    </div>
  );
}
