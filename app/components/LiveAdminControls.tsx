"use client";

import { useState } from "react";
import { Play, SkipForward, SkipBack, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface LiveAdminControlsProps {
  eventId: string;
  currentMatchOrder: number | null;
  totalMatches: number;
}

export default function LiveAdminControls({
  eventId,
  currentMatchOrder,
  totalMatches,
}: LiveAdminControlsProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const router = useRouter();
  const current = currentMatchOrder || 0;

  const updateMatch = async (order: number) => {
    if (order < 0 || order > totalMatches || isUpdating) return;
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentMatchOrder: order }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to update match order:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-[2rem] p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-xs font-black uppercase tracking-widest text-primary italic">Admin Match Tracker</h4>
          <p className="text-[10px] text-muted-foreground font-bold">Update this in real-time to highlight matches for fans.</p>
        </div>
        {isUpdating && <Loader2 className="w-4 h-4 text-primary animate-spin" />}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => updateMatch(Math.max(0, current - 1))}
          disabled={current <= 0 || isUpdating}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all active:scale-95"
          title="Previous Match"
        >
          <SkipBack className="w-4 h-4" />
        </button>

        <div className="flex-1 text-center">
          <p className="text-[9px] font-black uppercase text-muted-foreground mb-1">Status</p>
          <p className="text-xl font-black italic uppercase tracking-tighter">
            {current === 0 ? "Show Starting..." : `Match ${current} of ${totalMatches}`}
          </p>
        </div>

        <button
          onClick={() => updateMatch(Math.min(totalMatches, current + 1))}
          disabled={current >= totalMatches || isUpdating}
          className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 disabled:opacity-30 transition-all active:scale-95"
          title="Next Match"
        >
          <SkipForward className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
           onClick={() => updateMatch(0)}
           disabled={current === 0 || isUpdating}
           className="text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-white/5 hover:bg-white/5"
        >
           Reset Tracker
        </button>
        <button
           onClick={() => updateMatch(totalMatches)}
           disabled={current === totalMatches || isUpdating}
           className="text-[10px] font-black uppercase tracking-widest py-2 rounded-lg border border-primary/20 bg-primary/10 text-primary hover:bg-primary/20"
        >
           Final Match
        </button>
      </div>
    </div>
  );
}
