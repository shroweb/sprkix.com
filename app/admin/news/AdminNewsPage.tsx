"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ImageIcon, Newspaper, Plus, Save, Search, Sparkles, Trash2, Upload, X } from "lucide-react";
import MediaPicker from "../components/MediaPicker";

type NewsPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  status: string;
  featured: boolean;
  publishedAt: string | null;
  author?: { name: string | null; slug: string } | null;
  updatedAt: string;
};

type EntityResult = {
  type: "event" | "wrestler" | "promotion";
  id: string;
  label: string;
  slug: string;
  subtitle: string;
  shortcode: string;
};

type FormState = {
  id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  status: "draft" | "published";
  featured: boolean;
  publishedAt: string;
};

const EMPTY_FORM: FormState = {
  id: null,
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  seoTitle: "",
  seoDescription: "",
  status: "draft",
  featured: false,
  publishedAt: "",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminNewsPage() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [entityQuery, setEntityQuery] = useState("");
  const [entityResults, setEntityResults] = useState<EntityResult[]>([]);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  async function loadPosts(selectId?: string | null) {
    setLoading(true);
    const res = await fetch("/api/admin/news");
    const data = await res.json();
    const nextPosts = Array.isArray(data) ? data : [];
    setPosts(nextPosts);
    setLoading(false);

    if (selectId) {
      const selected = nextPosts.find((post: NewsPost) => post.id === selectId);
      if (selected) selectPost(selected);
    } else if (!form.id && nextPosts[0]) {
      selectPost(nextPosts[0]);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      if (entityQuery.trim().length < 2) {
        setEntityResults([]);
        return;
      }
      const res = await fetch(`/api/admin/news/entities?q=${encodeURIComponent(entityQuery.trim())}`);
      const data = await res.json();
      setEntityResults(Array.isArray(data.results) ? data.results : []);
    }, 250);

    return () => clearTimeout(timeout);
  }, [entityQuery]);

  function selectPost(post: NewsPost) {
    setForm({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
      coverImage: post.coverImage || "",
      seoTitle: post.seoTitle || "",
      seoDescription: post.seoDescription || "",
      status: post.status === "published" ? "published" : "draft",
      featured: !!post.featured,
      publishedAt: post.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "",
    });
    setMessage("");
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setMessage("");
  }

  function insertShortcode(shortcode: string) {
    const textarea = contentRef.current;
    const value = form.content;
    if (!textarea) {
      setForm((current) => ({ ...current, content: `${current.content}\n${shortcode}`.trim() }));
      return;
    }

    const start = textarea.selectionStart ?? value.length;
    const end = textarea.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${shortcode}${value.slice(end)}`;
    setForm((current) => ({ ...current, content: next }));

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + shortcode.length, start + shortcode.length);
    });
  }

  async function savePost() {
    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      slug: form.slug.trim() || slugify(form.title),
      publishedAt: form.publishedAt || null,
    };

    const res = await fetch(form.id ? `/api/admin/news/${form.id}` : "/api/admin/news", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to save post");
      setSaving(false);
      return;
    }

    setMessage(form.id ? "News post updated." : "News post created.");
    await loadPosts(data.id);
    setSaving(false);
  }

  async function deletePost() {
    if (!form.id) return;
    if (!window.confirm("Delete this news post?")) return;

    setSaving(true);
    const res = await fetch(`/api/admin/news/${form.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Failed to delete post");
      setSaving(false);
      return;
    }

    setMessage("News post deleted.");
    resetForm();
    await loadPosts();
    setSaving(false);
  }

  const selectedPostMeta = useMemo(
    () => posts.find((post) => post.id === form.id) || null,
    [posts, form.id],
  );

  return (
    <>
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">Newsroom</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Publish indexable wrestling news with internal entity links.
          </p>
        </div>
        <button
          onClick={resetForm}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-white hover:bg-slate-50 text-sm font-bold"
        >
          <Plus className="w-4 h-4" />
          New Post
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-8">
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Newspaper className="w-4 h-4 text-primary" />
            <h2 className="font-bold">Posts</h2>
          </div>
          <div className="max-h-[70vh] overflow-y-auto divide-y divide-border">
            {loading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading posts...</div>
            ) : posts.length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground">No news posts yet.</div>
            ) : (
              posts.map((post) => {
                const active = post.id === form.id;
                return (
                  <button
                    key={post.id}
                    onClick={() => selectPost(post)}
                    className={`w-full text-left px-5 py-4 transition-colors ${active ? "bg-primary/5" : "hover:bg-slate-50"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-black italic uppercase tracking-tight line-clamp-2">{post.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.excerpt}</p>
                      </div>
                      <span className={`shrink-0 text-[10px] font-black uppercase px-2 py-1 rounded-full ${post.status === "published" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                        {post.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-[11px] text-muted-foreground">
                      <span>{post.slug}</span>
                      {post.featured ? <span className="text-primary font-bold">Featured</span> : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-border p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Title">
                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      title: e.target.value,
                      slug: current.id ? current.slug : slugify(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-border px-4 py-3"
                  placeholder="Breaking wrestling news title"
                />
              </Field>
              <Field label="Slug">
                <input
                  value={form.slug}
                  onChange={(e) => setForm((current) => ({ ...current, slug: slugify(e.target.value) }))}
                  className="w-full rounded-xl border border-border px-4 py-3"
                  placeholder="slug"
                />
              </Field>
            </div>

            <Field label="Excerpt">
              <textarea
                value={form.excerpt}
                onChange={(e) => setForm((current) => ({ ...current, excerpt: e.target.value }))}
                className="w-full rounded-xl border border-border px-4 py-3 min-h-24"
                placeholder="Short summary for list pages and search engines"
              />
            </Field>

            <Field label="Cover Image">
              <div className="space-y-4">
                <div className="rounded-2xl border border-border bg-slate-50/80 p-4">
                  {form.coverImage ? (
                    <div className="space-y-4">
                      <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border bg-black/5">
                        <img
                          src={form.coverImage}
                          alt="Selected cover"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setShowMediaPicker(true)}
                          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-zinc-800"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          Change Image
                        </button>
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({ ...current, coverImage: "" }))}
                          className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-xs font-black uppercase text-muted-foreground transition-colors hover:bg-white"
                        >
                          <X className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{form.coverImage}</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white border border-border">
                          <ImageIcon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">No cover image selected</p>
                          <p className="text-xs text-muted-foreground">
                            Upload or choose from the media library.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-xs font-black uppercase text-white transition-colors hover:bg-zinc-800"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        Select Image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Field>

            <Field label="Article Body">
              <textarea
                ref={contentRef}
                value={form.content}
                onChange={(e) => setForm((current) => ({ ...current, content: e.target.value }))}
                className="w-full rounded-xl border border-border px-4 py-3 min-h-[420px] font-medium"
                placeholder={"Use blank lines between paragraphs.\nUse ## for subheadings.\nUse [[wrestler:cody-rhodes|Cody Rhodes]] for internal links."}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="SEO Title">
                <input
                  value={form.seoTitle}
                  onChange={(e) => setForm((current) => ({ ...current, seoTitle: e.target.value }))}
                  className="w-full rounded-xl border border-border px-4 py-3"
                  placeholder="Optional custom title tag"
                />
              </Field>
              <Field label="SEO Description">
                <input
                  value={form.seoDescription}
                  onChange={(e) => setForm((current) => ({ ...current, seoDescription: e.target.value }))}
                  className="w-full rounded-xl border border-border px-4 py-3"
                  placeholder="Optional custom meta description"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => setForm((current) => ({ ...current, status: e.target.value as "draft" | "published" }))}
                  className="w-full rounded-xl border border-border px-4 py-3 bg-white"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </Field>
              <Field label="Published At">
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={(e) => setForm((current) => ({ ...current, publishedAt: e.target.value }))}
                  className="w-full rounded-xl border border-border px-4 py-3"
                />
              </Field>
              <label className="inline-flex items-center gap-3 rounded-xl border border-border px-4 py-3 h-[52px]">
                <input
                  type="checkbox"
                  checked={form.featured}
                  onChange={(e) => setForm((current) => ({ ...current, featured: e.target.checked }))}
                />
                <span className="text-sm font-bold">Featured post</span>
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={savePost}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-black font-black uppercase text-sm disabled:opacity-60"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : form.id ? "Update Post" : "Create Post"}
              </button>
              {form.id ? (
                <button
                  onClick={deletePost}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-red-200 text-red-600 font-black uppercase text-sm disabled:opacity-60"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              ) : null}
              {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
              {selectedPostMeta?.slug ? (
                <a
                  href={`/news/${selectedPostMeta.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-bold text-primary hover:underline"
                >
                  View public article
                </a>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" />
                <h2 className="font-bold">Insert Internal Links</h2>
              </div>
              <input
                value={entityQuery}
                onChange={(e) => setEntityQuery(e.target.value)}
                className="w-full rounded-xl border border-border px-4 py-3"
                placeholder="Search events, wrestlers, promotions"
              />
              <div className="space-y-2">
                {entityResults.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Search for an entity, then click insert to add a highlighted internal link.
                  </p>
                ) : (
                  entityResults.map((result) => (
                    <div key={`${result.type}-${result.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{result.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {result.type} · {result.subtitle}
                        </p>
                      </div>
                      <button
                        onClick={() => insertShortcode(result.shortcode)}
                        className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-black uppercase"
                      >
                        Insert
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-bold">Writing Format</h2>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>`## Heading` for section titles</li>
                <li>`### Smaller Heading` for sub-sections</li>
                <li>`- bullet` for lists</li>
                <li>`[[event:slug|Label]]` for event links</li>
                <li>`[[wrestler:slug|Label]]` for wrestler links</li>
                <li>`[[promotion:slug|Label]]` for promotion links</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    {showMediaPicker ? (
      <MediaPicker
        title="Select News Cover Image"
        onClose={() => setShowMediaPicker(false)}
        onSelect={(url) => {
          setForm((current) => ({ ...current, coverImage: url }));
          setShowMediaPicker(false);
        }}
      />
    ) : null}
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
