"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Search, Check, Upload, ImageIcon } from "lucide-react";
import { useRef } from "react";

interface MediaItem {
  id: string;
  filename: string;
  url: string;
  size: number | null;
}

interface MediaPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
  title?: string;
}

export default function MediaPicker({
  onSelect,
  onClose,
  title = "Select Image",
}: MediaPickerProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    const res = await fetch("/api/admin/media");
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleUpload = async (files: FileList | File[]) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("file", f));
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) await fetchMedia();
    setUploading(false);
  };

  const filtered = items.filter((i) =>
    i.filename.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-xs text-muted-foreground">
              {items.length} files · click to select
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-zinc-800 disabled:opacity-50 transition-all"
            >
              <Upload className="w-3.5 h-3.5" />
              {uploading ? "Uploading..." : "Upload New"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && handleUpload(e.target.files)}
            />
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-3 border-b border-border">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
          </div>
        </div>

        {/* Drag Drop + Grid */}
        <div
          className="flex-1 overflow-y-auto p-6"
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
        >
          {isDragging && (
            <div className="fixed inset-0 z-10 flex items-center justify-center bg-primary/10 border-4 border-dashed border-primary rounded-2xl pointer-events-none">
              <div className="text-center">
                <Upload className="w-12 h-12 text-primary mx-auto mb-2" />
                <p className="text-primary font-bold text-lg">Drop to upload</p>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="aspect-[3/4] bg-slate-100 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground font-medium">
                No images. Upload some above or drag here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.url);
                    onClose();
                  }}
                  className="group relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border-2 border-transparent hover:border-primary transition-all hover:shadow-lg hover:shadow-primary/20"
                >
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-[9px] font-bold truncate">
                      {item.filename}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
