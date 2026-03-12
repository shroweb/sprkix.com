"use client";

import { useState } from "react";
import { ThumbsUp } from "lucide-react";

export default function ReviewUpvote({
  reviewId,
  initialCount,
  initialVoted,
  isLoggedIn,
}: {
  reviewId: string;
  initialCount: number;
  initialVoted: boolean;
  isLoggedIn: boolean;
}) {
  const [voted, setVoted] = useState(initialVoted);
  const [count, setCount] = useState(initialCount);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    if (!isLoggedIn || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/vote`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setVoted(data.voted);
        setCount(data.count);
      }
    } catch {
      /* noop */
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!isLoggedIn || loading}
      title={
        isLoggedIn
          ? voted
            ? "Remove helpful vote"
            : "Mark as helpful"
          : "Login to vote"
      }
      className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-all rounded-lg px-2 py-1 ${
        voted
          ? "text-primary bg-primary/10 border border-primary/20"
          : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
      } ${!isLoggedIn ? "cursor-default opacity-50" : "cursor-pointer"}`}
    >
      <ThumbsUp className={`w-3 h-3 ${voted ? "fill-current" : ""}`} />
      {count > 0 && <span>{count}</span>}
      <span className="hidden sm:inline">{voted ? "Helpful" : "Helpful?"}</span>
    </button>
  );
}
