"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import MediaPicker from "../components/MediaPicker";
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Sparkles,
  ImageIcon,
} from "lucide-react";

export default function AdminEventsPage() {
  const [form, setForm] = useState({
    title: "",
    slug: "",
    date: "",
    promotion: "",
    venue: "",
    posterUrl: "",
    description: "",
    type: "tv",
    tmdbId: "",
  });
  const [message, setMessage] = useState("");
  const [events, setEvents] = useState<
    {
      id: string;
      title: string;
      date: string;
      promotion: string;
      type: string;
      venue?: string | null;
    }[]
  >([]);
  const [search, setSearch] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const [promotions, setPromotions] = useState<
    { id: string; shortName: string }[]
  >([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  useEffect(() => {
    fetch("/api/admin/promotions")
      .then((r) => (r.ok ? r.json() : []))
      .then(setPromotions);
  }, []);

  const handleFetchCagematch = async () => {
    if (!importUrl) return;
    setFetchingInfo(true);
    try {
      const res = await fetch("/api/admin/events/fetch-cagematch-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: importUrl }),
      });
      if (res.ok) {
        const data = await res.json();
        const autoTitle = data.title || "";
        const autoSlug = autoTitle
          ? autoTitle
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^\w-]+/g, "")
              .replace(/--+/g, "-")
          : "";
        // Match promotion against loaded list (case-insensitive), fall back to returned value
        const matchedPromotion = data.promotion
          ? (promotions.find(
              (p) => p.shortName.toLowerCase() === data.promotion.toLowerCase(),
            )?.shortName ?? data.promotion)
          : "";
        setForm((prev) => ({
          ...prev,
          title: autoTitle || prev.title,
          slug: autoSlug || prev.slug,
          date: data.date || prev.date,
          promotion: matchedPromotion || prev.promotion,
          venue: data.venue || prev.venue,
          type: data.type || prev.type,
          posterUrl: data.posterUrl || prev.posterUrl,
        }));
        setMessage("✨ Event info pulled from Cagematch!");
      } else {
        setMessage("❌ Could not fetch Cagematch info");
      }
    } catch {
      setMessage("❌ Network error fetching info");
    } finally {
      setFetchingInfo(false);
    }
  };

  useEffect(() => {
    async function fetchEvents() {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    }
    fetchEvents();
  }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setUploading(true);

    let uploadedPosterUrl = form.posterUrl;

    if (posterFile) {
      const formData = new FormData();
      formData.append("file", posterFile);

      try {
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadData.url) {
          uploadedPosterUrl = uploadData.url;
        }
      } catch (error) {
        console.error("Poster upload failed", error);
        setMessage("❌ Error uploading poster");
        setUploading(false);
        return;
      }
    }

    const body = {
      ...form,
      posterUrl: uploadedPosterUrl,
      profightdbUrl: importUrl,
      slug:
        form.slug ||
        form.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]+/g, ""),
    };

    const res = await fetch("/api/admin/add-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      setMessage("✅ Event added successfully!");
      setForm({
        title: "",
        slug: "",
        date: "",
        promotion: "",
        venue: "",
        posterUrl: "",
        description: "",
        type: "tv",
        tmdbId: "",
      });
      setPosterFile(null);
      setIsAdding(false);
      const updatedRes = await fetch("/api/events");
      if (updatedRes.ok) {
        const updatedData = await updatedRes.json();
        setEvents(updatedData);
      }
    } else {
      setMessage("❌ Error adding event");
    }
    setUploading(false);
  };

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Events Management
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and organize your wrestling events.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center gap-2"
        >
          {isAdding ? (
            "Cancel"
          ) : (
            <>
              <Plus className="w-4 h-4" /> Add Event
            </>
          )}
        </button>
      </div>

      {isAdding && (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">Create New Event</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  className="bg-secondary border-none rounded-xl p-2 pl-3 text-xs w-64 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Cagematch URL to autofill..."
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleFetchCagematch}
                disabled={fetchingInfo}
                className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-zinc-800 disabled:opacity-50 transition-all"
              >
                {fetchingInfo ? (
                  "Fetching..."
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> Pull Info
                  </>
                )}
              </button>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Event Title
                </label>
                <input
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. WrestleMania XL"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Slug (Optional)
                </label>
                <input
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="wrestlemania-xl"
                  value={form.slug}
                  onChange={(e) => update("slug", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Date
                  </label>
                  <input
                    className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    type="date"
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Promotion
                  </label>
                  {promotions.length > 0 ? (
                    <select
                      className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      value={form.promotion}
                      onChange={(e) => update("promotion", e.target.value)}
                      required
                    >
                      <option value="">Select promotion...</option>
                      {promotions.map((p) => (
                        <option key={p.id} value={p.shortName}>
                          {p.shortName}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                      placeholder="WWE"
                      value={form.promotion}
                      onChange={(e) => update("promotion", e.target.value)}
                      required
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    Type
                  </label>
                  <select
                    className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    value={form.type}
                    onChange={(e) => update("type", e.target.value)}
                  >
                    <option value="tv">TV Show</option>
                    <option value="ppv">PPV / PLE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                    TMDb ID
                  </label>
                  <input
                    className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Optional"
                    value={form.tmdbId}
                    onChange={(e) => update("tmdbId", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Venue
                </label>
                <input
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  placeholder="e.g. Madison Square Garden"
                  value={form.venue}
                  onChange={(e) => update("venue", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">
                  Description
                </label>
                <textarea
                  className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none"
                  rows={3}
                  placeholder="Tell us about the event..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div className="flex items-end justify-between gap-4">
                <div className="flex-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-1 flex justify-between items-center">
                    <span>Poster</span>
                    {posterFile && (
                      <span className="text-primary truncate ml-2 max-w-[150px] lowercase text-[10px]">
                        {posterFile.name}
                      </span>
                    )}
                    {form.posterUrl && !posterFile && (
                      <span className="text-emerald-600 text-[10px] font-bold">
                        ✓ Set
                      </span>
                    )}
                  </label>
                  {/* Poster preview */}
                  {form.posterUrl && (
                    <div className="mb-2 relative w-16 h-20 rounded-lg overflow-hidden border border-border">
                      <img
                        src={form.posterUrl}
                        alt="poster"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      className="w-full bg-secondary border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary outline-none flex-1"
                      placeholder="https://..."
                      value={form.posterUrl}
                      onChange={(e) => update("posterUrl", e.target.value)}
                      disabled={!!posterFile}
                    />
                    <button
                      type="button"
                      onClick={() => setShowMediaPicker(true)}
                      className="bg-secondary text-foreground px-4 rounded-xl hover:bg-muted transition-colors flex items-center justify-center shrink-0 gap-1.5 text-xs font-bold"
                    >
                      <ImageIcon className="w-3.5 h-3.5" /> Library
                    </button>
                    <label className="cursor-pointer bg-secondary text-foreground px-4 rounded-xl hover:bg-muted transition-colors flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold uppercase">
                        Upload
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setPosterFile(e.target.files[0]);
                            update("posterUrl", "");
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
                <button
                  className="btn-primary h-[44px] px-8 shrink-0 flex items-center justify-center min-w-[140px]"
                  type="submit"
                  disabled={uploading}
                >
                  {uploading ? "Processing..." : "Create Event"}
                </button>
              </div>
            </div>
          </form>
          {message && (
            <p className="text-sm mt-4 font-medium text-emerald-600">
              {message}
            </p>
          )}
        </div>
      )}

      {/* Media Picker Modal */}
      {showMediaPicker && (
        <MediaPicker
          title="Select Event Poster"
          onSelect={(url) => {
            update("posterUrl", url);
            setPosterFile(null);
          }}
          onClose={() => setShowMediaPicker(false)}
        />
      )}

      {/* Events Table Container */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search events by title or promotion..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <span className="text-xs font-medium text-muted-foreground">
            {events.length} Total Events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                <th className="px-6 py-4">Event Details</th>
                <th className="px-6 py-4">Promotion</th>
                <th className="px-6 py-4">Venue</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {events
                .filter(
                  (event) =>
                    event.title.toLowerCase().includes(search.toLowerCase()) ||
                    event.promotion
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((event) => (
                  <tr
                    key={event.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-foreground">
                          {event.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ID: {event.id.substring(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-md font-bold text-[10px] uppercase">
                        {event.promotion}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[150px]">
                      {event.venue || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(event.date).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="capitalize">{event.type || "TV"}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/admin/events/${event.id}/edit`}
                          className="p-2 hover:bg-amber-50 text-amber-600 rounded-lg transition-colors"
                          title="Edit Event"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={async () => {
                            if (
                              confirm(
                                `Are you sure you want to delete "${event.title}"?`,
                              )
                            ) {
                              const res = await fetch(
                                `/api/admin/delete-event/${event.id}`,
                                { method: "DELETE" },
                              );
                              if (res.ok) {
                                setEvents(
                                  events.filter((e) => e.id !== event.id),
                                );
                              }
                            }
                          }}
                          className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-muted-foreground">
              No events found matching your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
