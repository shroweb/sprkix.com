"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Save,
  Loader2,
  CheckCircle,
  Upload,
  User,
} from "lucide-react";

export default function EditProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [favoritePromotion, setFavoritePromotion] = useState("");
  const [profileThemeEventId, setProfileThemeEventId] = useState("");
  const [themeSlug, setThemeSlug] = useState("");
  const [promotions, setPromotions] = useState<any[]>([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setName(data.user.name || "");
          setAvatarUrl(data.user.avatarUrl || "");
          setSlug(data.user.slug || "");
          setFavoritePromotion(data.user.favoritePromotion || "");
          setProfileThemeEventId(data.user.profileThemeEventId || "");
          if (data.user.profileThemeEvent) {
             setThemeSlug(data.user.profileThemeEvent.slug);
          }
        } else {
          setError("Could not load your profile. Please refresh and try again.");
        }
      })
      .catch(() => {
        setError("Could not load your profile. Please check your connection.");
      });

    fetch("/api/admin/promotions")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPromotions(data);
        // Non-critical — promotions dropdown just stays empty if this fails
      })
      .catch(() => {});
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", e.target.files[0]);
      const res = await fetch("/api/upload/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.url) setAvatarUrl(data.url);
      else setError("Upload failed.");
    } catch {
      setError("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name cannot be empty");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatarUrl,
          slug: slug.trim().toLowerCase(),
          favoritePromotion: favoritePromotion || null,
          profileThemeEventId: profileThemeEventId || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/profile"), 1200);
      } else {
        setError(data.error ?? "Failed to save");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-20 space-y-8">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </Link>

      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-primary" />
          <span className="text-xs font-black uppercase tracking-[0.2em] text-primary italic">
            Account
          </span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">
          Edit Profile
        </h1>
      </div>

      <div className="bg-card/40 border border-white/5 rounded-[2rem] p-5 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Profile Picture
            </label>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-2xl bg-secondary overflow-hidden flex items-center justify-center border border-white/10 shrink-0">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <label className="cursor-pointer inline-flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-tighter hover:opacity-90 transition-opacity">
                  {uploading ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  {uploading ? "Uploading..." : "Upload Photo"}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => setAvatarUrl("")}
                    className="block text-[10px] font-bold text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove photo
                  </button>
                )}
                <p className="text-[10px] text-muted-foreground">
                  JPG, PNG or WEBP. Max 5MB.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your display name..."
              className="w-full bg-black/20 border border-border rounded-xl p-4 font-bold text-sm outline-none focus:border-primary/50 transition-all text-foreground"
              maxLength={50}
            />
            <p className="text-[10px] text-muted-foreground font-medium">
              This is how you appear across the site.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Profile Handle (URL)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">@</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="your-handle"
                className="w-full bg-black/20 border border-border rounded-xl p-4 pl-8 font-bold text-sm outline-none focus:border-primary/50 transition-all text-foreground"
                maxLength={32}
              />
            </div>
            <p className="text-[10px] text-muted-foreground font-medium italic">
              Your profile: <span className="text-primary">sprkix.com/users/{slug || "username"}</span>
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Favorite Promotion
            </label>
            <select
              value={favoritePromotion}
              onChange={(e) => setFavoritePromotion(e.target.value)}
              className="w-full bg-black/20 border border-border rounded-xl p-4 font-bold text-sm outline-none focus:border-primary/50 transition-all appearance-none text-foreground"
            >
              <option value="">None / Calculated Automatically</option>
              {promotions.map((p) => (
                <option key={p.id} value={p.shortName}>
                  {p.fullName ? `${p.shortName} - ${p.fullName}` : p.shortName}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-muted-foreground font-medium">
              Manually pin your favorite promotion to your profile stats.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Profile Theme (Event Slug)
            </label>
            <div className="flex gap-2">
                <input
                  type="text"
                  value={themeSlug}
                  onChange={(e) => setThemeSlug(e.target.value)}
                  placeholder="e.g. wrestlemania-40"
                  className="flex-1 bg-black/20 border border-border rounded-xl p-4 font-bold text-sm outline-none focus:border-primary/50 transition-all text-foreground"
                />
                <button
                    type="button"
                    onClick={async () => {
                        if (!themeSlug) return;
                        const res = await fetch(`/api/search/event-by-slug?slug=${themeSlug}`);
                        const data = await res.json();
                        if (data.id) {
                            setProfileThemeEventId(data.id);
                            setError("");
                        } else {
                            setError("Event not found. Make sure the slug is correct.");
                        }
                    }}
                    className="px-4 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                >
                    Apply
                </button>
            </div>
            <p className="text-[10px] text-muted-foreground font-medium">
              Personalise your profile with an event's poster as your theme.
            </p>
            {profileThemeEventId && (
                <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Theme applied! Save to confirm.
                </p>
            )}
          </div>

          {error && (
            <p className="text-xs font-bold text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
              {error}
            </p>
          )}
          {success && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-4 py-3 rounded-xl">
              <CheckCircle className="w-4 h-4" /> Saved! Redirecting...
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || success || !name.trim()}
              className="btn-primary flex items-center gap-2 px-6 py-3 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/profile"
              className="px-6 py-3 font-bold text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
