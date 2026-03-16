"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ExternalLink, RefreshCcw, Clock, ChevronDown, ChevronUp, Calendar, MapPin, Tv, Users, Link2 } from "lucide-react";
import Link from "next/link";

type Submission = {
  id: string;
  title: string;
  date: string;
  promotion: string;
  venue: string | null;
  city: string | null;
  attendance: number | null;
  network: string | null;
  posterUrl: string | null;
  description: string | null;
  type: string | null;
  sourceUrl: string;
  status: string;
  rejectionReason: string | null;
  approvedEventId: string | null;
  createdAt: string;
  user: { id: string; name: string | null; slug: string; email: string };
};

const STATUS_COLORS: Record<string, string> = {
  pending:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  rejected: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminSubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectBox, setShowRejectBox] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/submissions");
    const data = await res.json();
    setSubmissions(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function approve(id: string) {
    setActing(id);
    const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      await load();
    } else {
      alert(data.error || "Failed to approve");
    }
    setActing(null);
  }

  async function reject(id: string) {
    setActing(id);
    const res = await fetch(`/api/admin/submissions/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: rejectReason[id] || "" }),
    });
    const data = await res.json();
    if (res.ok) {
      setShowRejectBox(null);
      await load();
    } else {
      alert(data.error || "Failed to reject");
    }
    setActing(null);
  }

  const pending  = submissions.filter(s => s.status === "pending");
  const reviewed = submissions.filter(s => s.status !== "pending");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Event Submissions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pending.length} pending review
          </p>
        </div>
        <button onClick={load} className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary/30 transition-all">
          <RefreshCcw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCcw className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-2xl p-16 text-center">
          <p className="text-muted-foreground font-bold italic">No submissions yet.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Pending */}
          {pending.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5" /> Pending Review ({pending.length})
              </h2>
              {pending.map(s => (
                <SubmissionCard
                  key={s.id}
                  s={s}
                  expanded={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  acting={acting === s.id}
                  onApprove={() => approve(s.id)}
                  showRejectBox={showRejectBox === s.id}
                  onShowReject={() => setShowRejectBox(showRejectBox === s.id ? null : s.id)}
                  rejectReason={rejectReason[s.id] || ""}
                  onRejectReasonChange={v => setRejectReason(r => ({ ...r, [s.id]: v }))}
                  onReject={() => reject(s.id)}
                />
              ))}
            </div>
          )}

          {/* Reviewed */}
          {reviewed.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                Previously Reviewed ({reviewed.length})
              </h2>
              {reviewed.map(s => (
                <SubmissionCard
                  key={s.id}
                  s={s}
                  expanded={expanded === s.id}
                  onToggle={() => setExpanded(expanded === s.id ? null : s.id)}
                  acting={false}
                  onApprove={() => {}}
                  showRejectBox={false}
                  onShowReject={() => {}}
                  rejectReason=""
                  onRejectReasonChange={() => {}}
                  onReject={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SubmissionCard({
  s, expanded, onToggle, acting, onApprove,
  showRejectBox, onShowReject, rejectReason, onRejectReasonChange, onReject,
}: {
  s: Submission;
  expanded: boolean;
  onToggle: () => void;
  acting: boolean;
  onApprove: () => void;
  showRejectBox: boolean;
  onShowReject: () => void;
  rejectReason: string;
  onRejectReasonChange: (v: string) => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-card border border-white/5 rounded-2xl overflow-hidden">
      {/* Summary row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/2 transition-colors"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-black text-sm italic uppercase tracking-tight truncate">{s.title}</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status]}`}>
              {s.status}
            </span>
            {s.type && (
              <span className="text-[10px] font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-full">{s.type}</span>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1 text-[11px] text-muted-foreground">
            <span className="font-bold text-primary/70">{s.promotion}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
            {s.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{s.city}</span>}
            <span>by <Link href={`/users/${s.user.slug}`} className="text-foreground font-bold hover:text-primary" onClick={e => e.stopPropagation()}>{s.user.name}</Link></span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-white/5 p-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {s.venue && <Detail icon={<MapPin className="w-3 h-3" />} label="Venue" value={s.venue} />}
            {s.city && <Detail icon={<MapPin className="w-3 h-3" />} label="City" value={s.city} />}
            {s.network && <Detail icon={<Tv className="w-3 h-3" />} label="Network" value={s.network} />}
            {s.attendance && <Detail icon={<Users className="w-3 h-3" />} label="Attendance" value={s.attendance.toLocaleString()} />}
          </div>

          {s.description && (
            <p className="text-sm text-muted-foreground italic">{s.description}</p>
          )}

          {s.posterUrl && (
            <div className="flex items-center gap-2">
              <img src={s.posterUrl} alt="Poster" className="w-16 h-20 object-cover rounded-lg border border-white/10" />
              <a href={s.posterUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                View poster <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs">
            <Link2 className="w-3 h-3 text-muted-foreground" />
            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-mono truncate">
              {s.sourceUrl}
            </a>
            <a href={s.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-3 h-3 text-muted-foreground hover:text-primary" />
            </a>
          </div>

          {s.status === "rejected" && s.rejectionReason && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
              <span className="font-black">Rejection reason: </span>{s.rejectionReason}
            </div>
          )}

          {s.status === "approved" && s.approvedEventId && (
            <div className="flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span>Approved — event created</span>
            </div>
          )}

          {/* Actions for pending */}
          {s.status === "pending" && (
            <div className="flex flex-col gap-3 pt-2 border-t border-white/5">
              <div className="flex gap-3">
                <button
                  onClick={onApprove}
                  disabled={acting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-sm font-black transition-all disabled:opacity-50"
                >
                  {acting ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Approve
                </button>
                <button
                  onClick={onShowReject}
                  disabled={acting}
                  className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-black transition-all disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reject
                </button>
              </div>
              {showRejectBox && (
                <div className="space-y-2">
                  <textarea
                    value={rejectReason}
                    onChange={e => onRejectReasonChange(e.target.value)}
                    placeholder="Rejection reason (optional — shown to the user)"
                    rows={2}
                    className="w-full bg-background border-2 border-red-500/20 rounded-xl p-3 text-sm resize-none outline-none focus:border-red-500/40 transition-all"
                  />
                  <button
                    onClick={onReject}
                    disabled={acting}
                    className="px-5 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-sm font-black transition-all disabled:opacity-50"
                  >
                    Confirm Rejection
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1">{icon} {label}</p>
      <p className="text-sm font-bold">{value}</p>
    </div>
  );
}
