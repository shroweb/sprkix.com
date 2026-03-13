"use client";

import { useState } from "react";
import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";

export default function WatchlistIcon({
  eventId,
  initialActive,
}: {
  eventId: string;
  initialActive: boolean;
}) {
  const [active, setActive] = useState(initialActive);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const toggle = async () => {
    setLoading(true);
    const res = await fetch("/api/watchlist", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId, watchlist: !active }),
    });
    if (res.ok) {
      setActive(!active);
      router.refresh();
    }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={active ? "Remove from Watchlist" : "Add to Watchlist"}
      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 ${
        active
          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
          : "bg-white/5 text-muted-foreground border-white/10 hover:border-primary/30 hover:text-primary"
      }`}
    >
      <Bookmark className={`w-4 h-4 ${active ? "fill-current" : ""}`} />
    </button>
  );
}
