"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Upload, Trash2, Check, ImageIcon, Search } from "lucide-react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  mimeType: string | null;
  size: number | null;
  createdAt: string;
}

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async (cursor?: string) => {
    const url = `/api/admin/media${cursor ? `?cursor=${cursor}` : ""}`;
    const res = await fetch(url);
    if (!res.ok) return;
    const data = await res.json();
    setItems((prev) => (cursor ? [...prev, ...data.items] : data.items));
    setNextCursor(data.nextCursor);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    setUploadProgress([]);
    const fileArr = Array.from(files);
    // Upload in batches of 5
    for (let i = 0; i < fileArr.length; i += 5) {
      const batch = fileArr.slice(i, i + 5);
      const formData = new FormData();
      batch.forEach((f) => formData.append("file", f));
      setUploadProgress((prev) => [
        ...prev,
        `Uploading ${batch.map((f) => f.name).join(", ")}...`,
      ]);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setUploadProgress((prev) => [
          ...prev.slice(0, -1),
          `✅ ${batch.map((f) => f.name).join(", ")}`,
        ]);
      } else {
        setUploadProgress((prev) => [
          ...prev.slice(0, -1),
          `❌ Failed: ${batch.map((f) => f.name).join(", ")}`,
        ]);
      }
    }
    setUploading(false);
    fetchMedia();
  };

  const handleDelete = async (id: string) => {
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.filter((i) => i.id !== id));
    setSelected((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Delete ${selected.size} item(s)?`)) return;
    for (const id of selected) await handleDelete(id);
    setSelected(new Set());
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  };

  const filtered = items.filter((i) =>
    i.filename.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {items.length} files · drag &amp; drop to upload
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selected.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Delete {selected.size}
            </button>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Files
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files && handleUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          e.dataTransfer.files && handleUpload(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50 hover:bg-slate-50"}`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload
          className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`}
        />
        <p className="font-bold text-sm">
          {isDragging
            ? "Drop to upload!"
            : "Drag & drop images here, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          JPG, PNG, WEBP, AVIF — multiple files supported
        </p>
      </div>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="bg-white rounded-2xl border border-border p-4 space-y-2">
          {uploadProgress.map((msg, i) => (
            <p key={i} className="text-sm font-medium">
              {msg}
            </p>
          ))}
          {uploading && (
            <div className="h-1 bg-primary/20 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-2/3" />
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by filename..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-10 pr-4 py-2 bg-white border border-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center">
          <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            No images yet. Upload some files above!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 cursor-pointer border-2 transition-all ${selected.has(item.id) ? "border-primary shadow-lg shadow-primary/20" : "border-transparent hover:border-slate-300"}`}
              onClick={() => toggleSelect(item.id)}
            >
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div
                className={`absolute inset-0 transition-opacity ${selected.has(item.id) ? "opacity-100" : "opacity-0 group-hover:opacity-100"} bg-black/50 flex flex-col justify-between p-2`}
              >
                {selected.has(item.id) ? (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center ml-auto">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-white ml-auto" />
                )}
                <div>
                  <p className="text-white text-[10px] font-bold truncate leading-tight">
                    {item.filename}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    {item.size && (
                      <span className="text-white/70 text-[9px]">
                        {formatSize(item.size)}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                      className="p-1 bg-red-500 hover:bg-red-600 rounded-lg transition-colors ml-auto"
                    >
                      <Trash2 className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <div className="text-center">
          <button
            onClick={() => fetchMedia(nextCursor)}
            className="btn-secondary px-8 py-2 text-sm"
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
