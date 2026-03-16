"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Send, RefreshCcw, CheckCircle, AlertCircle, Link2, Calendar, MapPin, Tv, Users, Image, FileText, Tag, Upload } from "lucide-react";

const PROMOTIONS = ["AEW", "WWE", "NJPW", "ROH", "TNA", "GCW", "PWG", "MLW", "STARDOM", "Other"];
const EVENT_TYPES = ["PPV", "TV Special", "Weekly TV", "House Show", "Tournament", "Other"];

function isValidSourceUrl(url: string) {
  try {
    const u = new URL(url);
    return u.hostname.includes("cagematch.net") || u.hostname.includes("profightdb.com");
  } catch {
    return false;
  }
}

export default function SubmitEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: "", date: "", promotion: "", venue: "", city: "",
    attendance: "", network: "", posterUrl: "", description: "",
    type: "", sourceUrl: "",
  });
  const [customPromotion, setCustomPromotion] = useState("");

  function set(key: string, value: string) {
    setForm(f => ({ ...f, [key]: value }));
  }

  // Resolved promotion — if "Other" selected, use the custom text
  function resolvedPromotion() {
    return form.promotion === "Other" ? customPromotion : form.promotion;
  }

  async function handlePosterUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/poster", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) {
        set("posterUrl", data.url);
      } else {
        setError(data.error || "Upload failed");
      }
    } catch {
      setError("Upload failed — please try again");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValidSourceUrl(form.sourceUrl)) {
      setError("Source URL must be from cagematch.net or profightdb.com");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, promotion: resolvedPromotion() }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Submission failed");
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto pb-20 pt-10 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Submitted!</h1>
          <p className="text-muted-foreground font-medium">
            Your event has been sent for review. You'll get a notification once it's been approved or if we need more info.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => { setSuccess(false); setCustomPromotion(""); setForm({ title: "", date: "", promotion: "", venue: "", city: "", attendance: "", network: "", posterUrl: "", description: "", type: "", sourceUrl: "" }); }}
            className="px-6 py-2.5 bg-card border border-border rounded-xl text-sm font-black hover:border-primary/30 transition-all"
          >
            Submit Another
          </button>
          <button onClick={() => router.push("/events")} className="btn-primary px-6 py-2.5 text-sm font-black">
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">Community</span>
        </div>
        <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
          Submit an Event
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Know of an event that's missing? Submit it for review and we'll add it to the site.
        </p>
      </div>

      {/* Info box */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex gap-3">
        <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground space-y-1">
          <p className="font-bold text-foreground">Submission guidelines</p>
          <ul className="space-y-0.5 text-xs">
            <li>• Provide a Cagematch or ProFightDB link — we'll use it to verify the event and automatically import the match card</li>
            <li>• Check the site first to avoid duplicates</li>
            <li>• You can have up to 3 pending submissions at once</li>
            <li>• Approved submissions earn you <span className="font-bold text-foreground">5 rank points</span></li>
          </ul>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Tag className="w-3 h-3" /> Event Title *
          </label>
          <input
            required
            value={form.title}
            onChange={e => set("title", e.target.value)}
            placeholder="e.g. AEW All In 2025"
            className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
          />
        </div>

        {/* Date + Promotion */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3 h-3" /> Date *
            </label>
            <input
              required
              type="date"
              value={form.date}
              onChange={e => set("date", e.target.value)}
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Promotion *
            </label>
            <select
              required
              value={form.promotion}
              onChange={e => set("promotion", e.target.value)}
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
            >
              <option value="">Select promotion</option>
              {PROMOTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* If Other promotion, free text */}
        {form.promotion === "Other" && (
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Promotion Name *
            </label>
            <input
              required
              value={customPromotion}
              onChange={e => setCustomPromotion(e.target.value)}
              placeholder="Enter promotion name"
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all font-bold text-sm"
            />
          </div>
        )}

        {/* Venue + City */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> Venue
            </label>
            <input
              value={form.venue}
              onChange={e => set("venue", e.target.value)}
              placeholder="e.g. Wembley Stadium"
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3" /> City
            </label>
            <input
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="e.g. London, UK"
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Network + Attendance */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Tv className="w-3 h-3" /> Network / Broadcast
            </label>
            <input
              value={form.network}
              onChange={e => set("network", e.target.value)}
              placeholder="e.g. TNT, WWE Network"
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Attendance
            </label>
            <input
              type="number"
              value={form.attendance}
              onChange={e => set("attendance", e.target.value)}
              placeholder="e.g. 82000"
              className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm"
            />
          </div>
        </div>

        {/* Event Type */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Event Type
          </label>
          <div className="flex flex-wrap gap-2">
            {EVENT_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => set("type", form.type === t ? "" : t)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${form.type === t ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-muted-foreground hover:border-white/20"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Poster Image */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Image className="w-3 h-3" /> Poster Image
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={form.posterUrl}
              onChange={e => set("posterUrl", e.target.value)}
              placeholder="https://... or upload a file"
              className="flex-1 bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm font-mono"
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all disabled:opacity-50 whitespace-nowrap"
            >
              {uploading ? <RefreshCcw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Uploading..." : "Upload"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePosterUpload}
            />
          </div>
          {form.posterUrl && form.posterUrl.startsWith("http") && (
            <div className="mt-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.posterUrl} alt="Poster preview" className="h-24 rounded-lg object-contain bg-black/20" />
            </div>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Description
          </label>
          <textarea
            value={form.description}
            onChange={e => set("description", e.target.value)}
            rows={3}
            placeholder="Brief description of the event..."
            className="w-full bg-background border-2 border-white/10 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm resize-none"
          />
        </div>

        {/* Source URL — Cagematch / ProFightDB only */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
            <Link2 className="w-3 h-3" /> Source URL *
          </label>
          <input
            required
            type="url"
            value={form.sourceUrl}
            onChange={e => set("sourceUrl", e.target.value)}
            placeholder="https://www.cagematch.net/... or https://www.profightdb.com/..."
            className={`w-full bg-background border-2 p-3 rounded-xl outline-none focus:border-primary/50 transition-all text-sm font-mono ${form.sourceUrl && !isValidSourceUrl(form.sourceUrl) ? "border-red-500/50" : "border-white/10"}`}
          />
          {form.sourceUrl && !isValidSourceUrl(form.sourceUrl) ? (
            <p className="text-[10px] text-red-400">Must be a cagematch.net or profightdb.com URL</p>
          ) : (
            <p className="text-[10px] text-muted-foreground/60">
              Cagematch or ProFightDB only — we'll use this to verify and auto-import the match card.
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={saving || uploading}
          className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-sm font-black disabled:opacity-50"
        >
          {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          {saving ? "Submitting..." : "Submit for Review"}
        </button>
      </form>
    </div>
  );
}
