"use client";

import { useState } from "react";
import Link from "next/link";

type PollOption = {
  id: string;
  text: string;
  order: number;
  _count: { votes: number };
};

type Props = {
  poll: {
    id: string;
    question: string;
    options: PollOption[];
  };
  totalVotes: number;
  userVoteOptionId: string | null;
  isLoggedIn: boolean;
};

export default function HomePoll({
  poll,
  totalVotes: initialTotal,
  userVoteOptionId: initialVote,
  isLoggedIn,
}: Props) {
  const [votes, setVotes] = useState<Record<string, number>>(
    Object.fromEntries(poll.options.map((o) => [o.id, o._count.votes]))
  );
  const [userVote, setUserVote] = useState<string | null>(initialVote);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);

  const hasVoted = !!userVote;

  async function handleVote(optionId: string) {
    if (!isLoggedIn || hasVoted || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/poll/${poll.id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionId }),
      });
      const data = await res.json();
      if (data.success) {
        setVotes(data.votes);
        setUserVote(data.userVote);
        const newTotal = Object.values(data.votes as Record<string, number>).reduce(
          (a, b) => a + b,
          0
        );
        setTotal(newTotal);
        setAnimating(true);
        setTimeout(() => setAnimating(false), 700);
      }
    } catch (err) {
      console.error("Vote failed", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6 max-w-2xl mx-auto">
      {/* Header pill */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full animate-pulse">
          <span className="text-primary text-xs">⚡</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Community Poll
          </span>
        </span>
      </div>

      {/* Question */}
      <h2 className="text-2xl sm:text-3xl font-black italic uppercase tracking-tight leading-tight">
        {poll.question}
      </h2>

      {/* Options */}
      <div className="space-y-3">
        {poll.options.map((option) => {
          const voteCount = votes[option.id] ?? 0;
          const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
          const isWinner =
            hasVoted &&
            voteCount === Math.max(...Object.values(votes));
          const isUserChoice = userVote === option.id;

          if (hasVoted) {
            // Results view
            return (
              <div key={option.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-black uppercase tracking-wide ${
                      isUserChoice ? "text-primary" : "text-foreground"
                    }`}
                  >
                    {option.text}
                    {isUserChoice && (
                      <span className="ml-2 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-black">
                        Your vote
                      </span>
                    )}
                  </span>
                  <span className="text-xs font-black text-muted-foreground shrink-0">
                    {pct}% · {voteCount}
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${
                      isUserChoice
                        ? "bg-primary"
                        : isWinner
                        ? "bg-primary/60"
                        : "bg-muted-foreground/30"
                    } ${animating ? "transition-all" : ""}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }

          // Pre-vote view
          if (!isLoggedIn) {
            return (
              <div
                key={option.id}
                className="px-5 py-3 border border-border rounded-2xl text-sm font-black italic uppercase tracking-tight text-muted-foreground"
              >
                {option.text}
              </div>
            );
          }

          return (
            <button
              key={option.id}
              onClick={() => handleVote(option.id)}
              disabled={loading}
              className="w-full px-5 py-3 border border-border rounded-2xl text-sm font-black italic uppercase tracking-tight text-left hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {option.text}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-1 border-t border-border">
        <span>{total.toLocaleString()} {total === 1 ? "vote" : "votes"}</span>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="text-primary font-black hover:underline transition-colors"
          >
            Sign in to vote
          </Link>
        )}
        {hasVoted && (
          <span className="text-primary/70">Thanks for voting!</span>
        )}
      </div>
    </div>
  );
}
