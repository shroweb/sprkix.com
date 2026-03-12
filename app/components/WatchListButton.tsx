"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WatchListButton({
  eventId,
  isSavedInitial,
}: {
  eventId: string;
  isSavedInitial: boolean;
}) {
  const [isSaved, setIsSaved] = useState(isSavedInitial);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggleWatchlist = async () => {
    setLoading(true);
    const method = isSaved ? "DELETE" : "POST";

    const res = await fetch("/api/watchlist", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });

    if (res.ok) {
      setIsSaved(!isSaved);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggleWatchlist}
      disabled={loading}
      className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-sm ${
        isSaved 
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20" 
          : "bg-primary text-black border-primary hover:opacity-90 active:scale-95"
      }`}
    >
      {isSaved ? (
        <BookmarkCheck className="w-4 h-4" />
      ) : (
        <Bookmark className="w-4 h-4" />
      )}
      <span className="text-sm font-black italic">{isSaved ? "Saved" : "Watchlist"}</span>
    </button>
  );
}
