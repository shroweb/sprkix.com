"use client";

import { useState } from "react";
import { Star, Bookmark, Share2, Sparkles } from "lucide-react";
import { useToast } from "./ToastProvider";
import WatchlistIcon from "./WatchlistIcon";
import ShareButton from "./ShareButton";

export default function MobileEventBar({
  eventId,
  eventSlug,
  isLoggedIn,
  initialWatchlist,
}: {
  eventId: string;
  eventSlug: string;
  isLoggedIn: boolean;
  initialWatchlist?: boolean;
}) {
  const { showToast } = useToast();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 px-4 py-3 flex items-center justify-around shadow-2xl">
      <WatchlistIcon eventId={eventId} initialActive={initialWatchlist ?? false} />
      <button
        onClick={() => {
          const el = document.getElementById("ratings-section") || document.getElementById("event-tabs");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else showToast("Scroll to rate show", "info");
        }}
        className="flex flex-col items-center gap-1 text-slate-300 hover:text-amber-400 text-[10px] font-bold uppercase tracking-wider"
      >
        <Star className="w-5 h-5 text-amber-400" />
        <span>Rate</span>
      </button>
      <ShareButton minimal />
    </div>
  );
}
