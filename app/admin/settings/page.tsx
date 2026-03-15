"use client";

import { useState, useEffect, useRef } from "react";
import {
  Save,
  RefreshCcw,
  Layout,
  Image as ImageIcon,
  Type,
  Info,
  Upload,
  Star,
  MousePointer2,
  CheckCircle,
  AlertCircle,
  Megaphone,
  Link as LinkIcon,
  Palette,
  LogIn,
} from "lucide-react";

type MessageState = { type: "success" | "error"; text: string } | null;

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [message, setMessage] = useState<MessageState>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [settings, setSettings] = useState({
    HERO_TITLE: "",
    HERO_DESC: "",
    HERO_IMAGE: "",
    FEATURED_EVENT_ID: "",
    SITE_LOGO: "",
    LOGO_SIZE: "md",
    BANNER_TEXT: "",
    BANNER_LINK: "",
    BANNER_ENABLED: "false",
    SITE_TAGLINE: "",
    SITE_DESCRIPTION: "",
    PRIMARY_COLOR: "",
    PRIMARY_HOVER_COLOR: "",
    SOCIAL_LOGIN_ENABLED: "false",
  });
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const configs = data.configs || {};
        setSettings({
          HERO_TITLE: configs.HERO_TITLE || "RATE. REVIEW. \nWRESTLING.",
          HERO_DESC:
            configs.HERO_DESC ||
            "The definitive community archive for professional wrestling.",
          HERO_IMAGE: configs.HERO_IMAGE || "",
          FEATURED_EVENT_ID: configs.FEATURED_EVENT_ID || "",
          SITE_LOGO: configs.SITE_LOGO || "",
          LOGO_SIZE: configs.LOGO_SIZE || "md",
          BANNER_TEXT: configs.BANNER_TEXT || "",
          BANNER_LINK: configs.BANNER_LINK || "",
          BANNER_ENABLED: configs.BANNER_ENABLED || "false",
          SITE_TAGLINE: configs.SITE_TAGLINE || "Discover. Rate. Share.",
          SITE_DESCRIPTION: configs.SITE_DESCRIPTION || "The authoritative community archive for professional wrestling.",
          PRIMARY_COLOR: configs.PRIMARY_COLOR || "",
          PRIMARY_HOVER_COLOR: configs.PRIMARY_HOVER_COLOR || "",
          SOCIAL_LOGIN_ENABLED: configs.SOCIAL_LOGIN_ENABLED || "false",
        });
        setEvents(data.events || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const showMessage = (type: "success" | "error", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (res.ok) {
        showMessage("success", "Settings saved and published.");
      } else {
        const data = await res.json().catch(() => ({}));
        showMessage("error", data.detail || data.error || "Failed to save settings.");
      }
    } catch {
      showMessage("error", "Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "HERO_IMAGE" | "SITE_LOGO",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // For site settings (Logo/Hero), we use Base64 Data URLs.
    // This makes the uploader work instantly on Vercel by bypassing the read-only filesystem.
    setUploading(field);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setSettings((s) => ({ ...s, [field]: base64 }));
      setUploading(null);
      showMessage(
        "success",
        "Image processed locally. Click Publish to save to database.",
      );
      if (e.target) e.target.value = "";
    };
    reader.onerror = () => {
      setUploading(null);
      showMessage("error", "Failed to process image file.");
    };
    reader.readAsDataURL(file);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center p-32">
        <RefreshCcw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );

  const inputClass =
    "w-full bg-slate-50 border-2 border-slate-100 p-4 rounded-xl outline-none focus:border-primary/40 focus:bg-white transition-all";
  const labelClass =
    "text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2";
  const cardClass =
    "bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm";
  const cardHeaderClass =
    "p-6 border-b border-border bg-slate-50 flex items-center gap-3";

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tight text-foreground uppercase italic">
          Site Settings
        </h1>
        <p className="text-muted-foreground font-medium italic">
          Manage your site identity, branding, and public-facing content.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8"
      >
        <div className="space-y-6">
          {/* Logo */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <ImageIcon className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Site Logo
              </h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="flex gap-6 items-start">
                {/* Preview */}
                <div className="w-24 h-24 rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                  {settings.SITE_LOGO ? (
                    <img
                      src={settings.SITE_LOGO}
                      alt="Logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <Star className="w-8 h-8 text-primary fill-current" />
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <label className={labelClass}>
                    <ImageIcon className="w-3.5 h-3.5" /> Logo Image
                  </label>
                  <input
                    type="text"
                    value={settings.SITE_LOGO}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, SITE_LOGO: e.target.value }))
                    }
                    className={`${inputClass} font-mono text-xs`}
                    placeholder="Upload or paste image URL..."
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="inline-flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-tighter hover:opacity-90 transition-opacity"
                  >
                    {uploading === "SITE_LOGO" ? (
                      <RefreshCcw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Upload className="w-3 h-3" />
                    )}
                    Upload Logo
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleUpload(e, "SITE_LOGO")}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    Recommended: square PNG or SVG with transparency. Min
                    200×200px.
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className={labelClass}>
                  <ImageIcon className="w-3.5 h-3.5" /> Logo Display Size
                </label>
                <div className="flex gap-2">
                  {(["sm", "md", "lg", "xl"] as const).map((size) => {
                    const label = size.toUpperCase();
                    const barHeight = { sm: 8, md: 12, lg: 16, xl: 24 }[size];
                    const active = settings.LOGO_SIZE === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, LOGO_SIZE: size }))}
                        className={`flex-1 flex flex-col items-center justify-end gap-2 py-3 rounded-xl border-2 text-xs font-black uppercase tracking-wider transition-all ${
                          active
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-slate-100 bg-slate-50 text-muted-foreground hover:border-primary/30"
                        }`}
                      >
                        <div
                          className="rounded w-5 bg-current opacity-40"
                          style={{ height: barHeight }}
                        />
                        {label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Controls the height of the logo in the navigation bar.
                </p>
              </div>
            </div>
          </div>

          {/* Announcement Banner */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <Megaphone className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Announcement Banner
              </h2>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      BANNER_ENABLED:
                        s.BANNER_ENABLED === "true" ? "false" : "true",
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.BANNER_ENABLED === "true" ? "bg-primary" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${settings.BANNER_ENABLED === "true" ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-5">
              {settings.BANNER_ENABLED !== "true" && (
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-muted-foreground italic font-medium">
                  Toggle on to show a sitewide announcement banner above the
                  navigation.
                </div>
              )}
              <div className="space-y-3">
                <label className={labelClass}>
                  <Type className="w-3.5 h-3.5" /> Banner Message
                </label>
                <input
                  type="text"
                  value={settings.BANNER_TEXT}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, BANNER_TEXT: e.target.value }))
                  }
                  className={`${inputClass} font-medium`}
                  placeholder="e.g. WrestleMania Season is here! Check out the latest events →"
                />
              </div>
              <div className="space-y-3">
                <label className={labelClass}>
                  <LinkIcon className="w-3.5 h-3.5" /> Banner Link{" "}
                  <span className="font-medium normal-case tracking-normal opacity-60">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  value={settings.BANNER_LINK}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, BANNER_LINK: e.target.value }))
                  }
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="/events or https://..."
                />
              </div>
              {settings.BANNER_TEXT && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-bold text-center ${settings.BANNER_ENABLED === "true" ? "bg-primary text-black" : "bg-slate-100 text-slate-400"}`}
                >
                  {settings.BANNER_TEXT}
                </div>
              )}
            </div>
          </div>

          {/* Hero Section */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <Layout className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Homepage Hero Section
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-3">
                <label className={labelClass}>
                  <Type className="w-3.5 h-3.5" /> Headline Title
                </label>
                <input
                  type="text"
                  value={settings.HERO_TITLE}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, HERO_TITLE: e.target.value }))
                  }
                  className={`${inputClass} font-black uppercase italic text-xl tracking-tight`}
                  placeholder="RATE. REVIEW. WRESTLING."
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Tip: Use \n for manual line breaks.
                </p>
              </div>
              <div className="space-y-3">
                <label className={labelClass}>
                  <Info className="w-3.5 h-3.5" /> Sub-heading Description
                </label>
                <textarea
                  value={settings.HERO_DESC}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, HERO_DESC: e.target.value }))
                  }
                  className={`${inputClass} font-medium leading-relaxed italic`}
                  rows={3}
                  placeholder="Enter description..."
                />
              </div>
              <div className="space-y-4">
                <label className={labelClass}>
                  <ImageIcon className="w-3.5 h-3.5" /> Hero Backdrop Image
                </label>
                <input
                  type="text"
                  value={settings.HERO_IMAGE}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, HERO_IMAGE: e.target.value }))
                  }
                  className={`${inputClass} font-mono text-xs`}
                  placeholder="Upload or paste image URL..."
                />
                <button
                  type="button"
                  onClick={() => heroInputRef.current?.click()}
                  className="inline-flex items-center gap-2 bg-primary text-black px-4 py-2 rounded-lg text-xs font-black uppercase italic tracking-tighter hover:opacity-90 transition-opacity"
                >
                  {uploading === "HERO_IMAGE" ? (
                    <RefreshCcw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Upload className="w-3 h-3" />
                  )}
                  Upload Image
                </button>
                <input
                  ref={heroInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleUpload(e, "HERO_IMAGE")}
                />
                {settings.HERO_IMAGE && (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-100">
                    <img
                      src={settings.HERO_IMAGE}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                      <span className="text-white text-[10px] font-black uppercase tracking-widest italic">
                        Live Preview
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Site Metadata */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <Info className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Site Identity & SEO
              </h2>
            </div>
            <div className="p-8 space-y-5">
              <div className="space-y-3">
                <label className={labelClass}>
                  <Type className="w-3.5 h-3.5" /> Site Tagline
                </label>
                <input
                  type="text"
                  value={settings.SITE_TAGLINE}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, SITE_TAGLINE: e.target.value }))
                  }
                  className={`${inputClass} font-bold italic`}
                  placeholder="e.g. Discover. Rate. Share."
                />
                <p className="text-[10px] text-muted-foreground italic">
                  Appears in the browser tab title after the site name.
                </p>
              </div>
              <div className="space-y-3">
                <label className={labelClass}>
                  <Info className="w-3.5 h-3.5" /> Site SEO Description
                </label>
                <textarea
                  value={settings.SITE_DESCRIPTION}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, SITE_DESCRIPTION: e.target.value }))
                  }
                  className={`${inputClass} font-medium leading-relaxed italic`}
                  rows={3}
                  placeholder="The definitive community archive for professional wrestling..."
                />
                <p className="text-[10px] text-muted-foreground italic">
                  The primary description for search engines and social sharing.
                </p>
              </div>
            </div>
          </div>

          {/* Brand Colours */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <Palette className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Brand Colours
              </h2>
            </div>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Primary CTA Colour */}
                <div className="space-y-3">
                  <label className={labelClass}>
                    <Palette className="w-3.5 h-3.5" /> CTA / Primary Colour
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.PRIMARY_COLOR || "#fbbf24"}
                      onChange={(e) => setSettings((s) => ({ ...s, PRIMARY_COLOR: e.target.value }))}
                      className="w-12 h-12 rounded-xl border-2 border-slate-100 cursor-pointer p-1 bg-white"
                    />
                    <input
                      type="text"
                      value={settings.PRIMARY_COLOR}
                      onChange={(e) => setSettings((s) => ({ ...s, PRIMARY_COLOR: e.target.value }))}
                      className={`${inputClass} flex-1 font-mono text-sm`}
                      placeholder="#fbbf24 (amber — default)"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    Applies to buttons, active tabs, badges, and accents.
                  </p>
                </div>
                {/* Hover Colour */}
                <div className="space-y-3">
                  <label className={labelClass}>
                    <Palette className="w-3.5 h-3.5" /> Button Hover Colour
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={settings.PRIMARY_HOVER_COLOR || "#2dd4bf"}
                      onChange={(e) => setSettings((s) => ({ ...s, PRIMARY_HOVER_COLOR: e.target.value }))}
                      className="w-12 h-12 rounded-xl border-2 border-slate-100 cursor-pointer p-1 bg-white"
                    />
                    <input
                      type="text"
                      value={settings.PRIMARY_HOVER_COLOR}
                      onChange={(e) => setSettings((s) => ({ ...s, PRIMARY_HOVER_COLOR: e.target.value }))}
                      className={`${inputClass} flex-1 font-mono text-sm`}
                      placeholder="#2dd4bf (teal — default)"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    The colour buttons transition to on hover.
                  </p>
                </div>
              </div>
              {/* Live Preview */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <p className={labelClass}><Palette className="w-3.5 h-3.5" /> Preview</p>
                <div className="flex flex-wrap gap-3 items-center">
                  <button
                    type="button"
                    style={{ backgroundColor: settings.PRIMARY_COLOR || "#fbbf24" }}
                    className="px-6 py-2.5 rounded-xl text-black text-xs font-black uppercase italic tracking-widest transition-all"
                  >
                    Default State
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: settings.PRIMARY_HOVER_COLOR || "#2dd4bf" }}
                    className="px-6 py-2.5 rounded-xl text-black text-xs font-black uppercase italic tracking-widest transition-all"
                  >
                    Hover State
                  </button>
                  <p className="text-[10px] text-muted-foreground italic">Leave blank to use defaults.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Social Login */}
          <div className={cardClass}>
            <div className={cardHeaderClass}>
              <LogIn className="w-4 h-4 text-primary" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Social Login
              </h2>
              <div className="ml-auto">
                <button
                  type="button"
                  onClick={() =>
                    setSettings((s) => ({
                      ...s,
                      SOCIAL_LOGIN_ENABLED:
                        s.SOCIAL_LOGIN_ENABLED === "true" ? "false" : "true",
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.SOCIAL_LOGIN_ENABLED === "true" ? "bg-primary" : "bg-slate-200"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${settings.SOCIAL_LOGIN_ENABLED === "true" ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>
            <div className="p-8 space-y-4">
              {settings.SOCIAL_LOGIN_ENABLED !== "true" ? (
                <div className="bg-slate-50 rounded-2xl p-4 text-xs text-muted-foreground italic font-medium">
                  Social login is disabled. Toggle on to show Google and Facebook sign-in buttons on the login page.
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-700 font-medium space-y-1">
                  <p className="font-black">Social login is enabled.</p>
                  <p>Google and Facebook buttons will appear on the login page if their keys are set in environment variables.</p>
                </div>
              )}
              <div className="space-y-2 pt-1">
                <p className={labelClass}><LogIn className="w-3.5 h-3.5" /> Required Environment Variables</p>
                <div className="bg-slate-900 rounded-2xl p-4 font-mono text-xs space-y-1 text-slate-300">
                  <p><span className="text-yellow-400">GOOGLE_CLIENT_ID</span>=your-google-client-id</p>
                  <p><span className="text-yellow-400">GOOGLE_CLIENT_SECRET</span>=your-google-client-secret</p>
                  <p><span className="text-blue-400">FACEBOOK_APP_ID</span>=your-facebook-app-id</p>
                  <p><span className="text-blue-400">FACEBOOK_APP_SECRET</span>=your-facebook-app-secret</p>
                </div>
                <p className="text-[10px] text-muted-foreground italic">
                  Set these in your Vercel project environment variables. Redirect URIs: <br />
                  <span className="font-mono">/api/auth/google/callback</span> &nbsp;·&nbsp; <span className="font-mono">/api/auth/facebook/callback</span>
                </p>
              </div>
            </div>
          </div>

          {/* Featured Event */}
          <div className={cardClass}>
            <div className={`${cardHeaderClass} text-amber-600`}>
              <Star className="w-4 h-4 fill-current" />
              <h2 className="font-black uppercase italic tracking-tighter text-sm">
                Community Choice Spotlight
              </h2>
            </div>
            <div className="p-8 space-y-4">
              <label className={labelClass}>
                <MousePointer2 className="w-3.5 h-3.5" /> Featured Event
              </label>
              <select
                value={settings.FEATURED_EVENT_ID}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    FEATURED_EVENT_ID: e.target.value,
                  }))
                }
                className={`${inputClass} font-bold italic`}
              >
                <option value="">Auto-calculate (Most Rated)</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} ({event.promotion} -{" "}
                    {new Date(event.date).getFullYear()})
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground italic">
                Manually pin an event to the hero spotlight card.
              </p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4 lg:sticky lg:top-8 h-fit">
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
          <div className="bg-slate-900 rounded-[2rem] p-8 text-white space-y-6 shadow-2xl">
            <h3 className="font-black italic uppercase tracking-tighter text-lg">
              Platform Status
            </h3>
            <div className="h-px bg-white/10" />
            <p className="text-xs font-medium italic opacity-60 leading-relaxed">
              Changes apply instantly to the public storefront on publish.
            </p>
            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={saving}
                className="w-full bg-primary text-black py-4 rounded-2xl font-black uppercase italic text-sm tracking-tighter flex items-center justify-center gap-2 shadow-xl shadow-primary/30 hover:scale-[1.02] transition-transform disabled:opacity-50"
              >
                {saving ? (
                  <RefreshCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Publish Changes
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full py-3 text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
