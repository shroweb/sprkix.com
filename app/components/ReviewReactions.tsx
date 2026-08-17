"use client";

import { useState } from "react";
import { useToast } from "./ToastProvider";

const REACTIONS = [
  { type: "fire", label: "Great Take", emoji: "🔥" },
  { type: "spot_on", label: "Spot On", emoji: "🎯" },
  { type: "detailed", label: "Detailed", emoji: "🧠" },
  { type: "upvote", label: "Upvote", emoji: "👍" },
];

export default function ReviewReactions({
  reviewId,
  initialCounts = {},
  initialUserReactions = [],
  isLoggedIn = false,
}: {
  reviewId: string;
  initialCounts?: Record<string, number>;
  initialUserReactions?: string[];
  isLoggedIn?: boolean;
}) {
  const [counts, setCounts] = useState<Record<string, number>>(initialCounts);
  const [userReactions, setUserReactions] = useState<string[]>(initialUserReactions);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleReact = async (reactionType: string) => {
    if (!isLoggedIn) {
      showToast("Sign in to react to reviews", "info");
      return;
    }
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactionType }),
      });
      const data = await res.json();
      if (data.success) {
        setCounts(data.counts);
        setUserReactions(data.userReactions);
      }
    } catch (err) {
      console.error("Reaction failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap pt-2">
      {REACTIONS.map(({ type, label, emoji }) => {
        const count = counts[type] || 0;
        const active = userReactions.includes(type);

        return (
          <button
            key={type}
            type="button"
            onClick={() => handleReact(type)}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all border ${
              active
                ? "bg-primary/20 border-primary text-primary shadow-sm"
                : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
            }`}
          >
            <span>{emoji}</span>
            <span>{label}</span>
            {count > 0 && <span className="font-mono text-[10px] opacity-80">{count}</span>}
          </button>
        );
      })}
    </div>
  );
}
