"use client";

import { useState } from "react";
import { Bookmark, BookmarkCheck, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

type WatchState = "none" | "watchlist" | "watched";

export default function WatchListButton({
  eventId,
  initialState,
}: {
  eventId: string;
  initialState: WatchState;
}) {
  const [state, setState] = useState<WatchState>(initialState);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const cycle = async () => {
    setLoading(true);

    if (state === "none") {
      const res = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) setState("watchlist");
    } else if (state === "watchlist") {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) setState("watched");
    } else {
      const res = await fetch("/api/watchlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (res.ok) setState("none");
    }

    setLoading(false);
    router.refresh();
  };

  const config: Record<WatchState, { icon: React.ElementType; label: string; hint: string; className: string }> = {
    none: {
      icon: Bookmark,
      label: "Watchlist",
      hint: "Add to Watchlist",
      className: "bg-primary text-black border-primary hover:opacity-90",
    },
    watchlist: {
      icon: BookmarkCheck,
      label: "Saved",
      hint: "Mark as Watched",
      className:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-primary/10 hover:text-primary hover:border-primary/30",
    },
    watched: {
      icon: CheckCircle2,
      label: "Watched",
      hint: "Remove",
      className:
        "bg-primary/10 text-primary border-primary/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20",
    },
  };

  const { icon: Icon, label, hint, className } = config[state];

  return (
    <button
      onClick={cycle}
      disabled={loading}
      title={hint}
      className={`flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border text-sm active:scale-95 disabled:opacity-50 ${className}`}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm font-black italic">{label}</span>
    </button>
  );
}
