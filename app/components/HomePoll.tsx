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
  endsAt?: string | null;
};

export default function HomePoll({
  poll,
  totalVotes: initialTotal,
  userVoteOptionId: initialVote,
  isLoggedIn,
  endsAt,
}: Props) {
  const [votes, setVotes] = useState<Record<string, number>>(
    Object.fromEntries(poll.options.map((o) => [o.id, o._count.votes]))
  );
  const [userVote, setUserVote] = useState<string | null>(initialVote);
  const [total, setTotal] = useState(initialTotal);
  const [loading, setLoading] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [copied, setCopied] = useState(false);

  const isClosed = endsAt ? new Date(endsAt) < new Date() : false;
  const hasVoted = !!userVote;
  // Show results view when voted OR when poll is closed
  const showResults = hasVoted || isClosed;

  async function handleVote(optionId: string) {
    if (!isLoggedIn || loading || isClosed) return;
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

  async function handleShare() {
    const W = 1200, H = 630;
    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // ── Background ──────────────────────────────────────────────────
    ctx.fillStyle = "#0d0d14";
    ctx.fillRect(0, 0, W, H);

    // subtle top-left glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 600);
    glow.addColorStop(0, "rgba(251,191,36,0.12)");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // ── Border ───────────────────────────────────────────────────────
    ctx.strokeStyle = "rgba(251,191,36,0.25)";
    ctx.lineWidth = 2;
    roundRect(ctx, 12, 12, W - 24, H - 24, 24);
    ctx.stroke();

    // ── "COMMUNITY POLL" pill ────────────────────────────────────────
    ctx.fillStyle = "rgba(251,191,36,0.12)";
    roundRect(ctx, 56, 52, 210, 34, 17);
    ctx.fill();
    ctx.strokeStyle = "rgba(251,191,36,0.4)";
    ctx.lineWidth = 1;
    roundRect(ctx, 56, 52, 210, 34, 17);
    ctx.stroke();
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 12px system-ui, sans-serif";
    ctx.letterSpacing = "2px";
    ctx.fillText("⚡  COMMUNITY POLL", 78, 74);
    ctx.letterSpacing = "0px";

    // ── Question ─────────────────────────────────────────────────────
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 44px system-ui, sans-serif";
    const question = poll.question.toUpperCase();
    const words = question.split(" ");
    let line = "", lines: string[] = [];
    for (const word of words) {
      const test = line ? line + " " + word : word;
      if (ctx.measureText(test).width > W - 120) { lines.push(line); line = word; }
      else line = test;
    }
    if (line) lines.push(line);
    lines.slice(0, 3).forEach((l, i) => ctx.fillText(l, 56, 140 + i * 56));

    // ── Results bars ─────────────────────────────────────────────────
    const maxVotes = Math.max(...Object.values(votes), 1);
    const barTop = lines.length > 1 ? 260 : 220;
    const barH = 44;
    const barGap = 64;
    const barMaxW = W - 112;

    poll.options.forEach((opt, i) => {
      const voteCount = votes[opt.id] ?? 0;
      const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
      const isWinner = voteCount === maxVotes && maxVotes > 0;
      const isUserChoice = userVote === opt.id;
      const y = barTop + i * barGap;

      // bar track
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      roundRect(ctx, 56, y, barMaxW, barH, 10);
      ctx.fill();

      // bar fill
      const fillW = Math.max((pct / 100) * barMaxW, pct > 0 ? 24 : 0);
      const barColor = isUserChoice ? "#fbbf24" : isWinner ? "rgba(251,191,36,0.55)" : "rgba(255,255,255,0.18)";
      ctx.fillStyle = barColor;
      roundRect(ctx, 56, y, fillW, barH, 10);
      ctx.fill();

      // label
      ctx.fillStyle = isUserChoice ? "#fbbf24" : "#ffffff";
      ctx.font = `bold 14px system-ui, sans-serif`;
      ctx.fillText(opt.text.toUpperCase() + (isUserChoice ? "  ✓" : ""), 70, y + 28);

      // pct
      ctx.fillStyle = isUserChoice ? "#fbbf24" : "rgba(255,255,255,0.55)";
      ctx.font = "bold 14px system-ui, sans-serif";
      const pctLabel = `${pct}%`;
      const pctW = ctx.measureText(pctLabel).width;
      ctx.fillText(pctLabel, 56 + barMaxW - pctW - 14, y + 28);
    });

    // ── Footer ───────────────────────────────────────────────────────
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(56, H - 72, W - 112, 1);
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.font = "14px system-ui, sans-serif";
    ctx.fillText(`${total.toLocaleString()} ${total === 1 ? "vote" : "votes"}`, 56, H - 42);
    ctx.fillStyle = "#fbbf24";
    ctx.font = "bold 14px system-ui, sans-serif";
    const brand = "sprkix.com";
    const brandW = ctx.measureText(brand).width;
    ctx.fillText(brand, W - 56 - brandW, H - 42);

    // ── Download ─────────────────────────────────────────────────────
    const a = document.createElement("a");
    a.download = `poll-${poll.id}.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  const closedOrEnding = endsAt ? (
    isClosed ? (
      <div className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black uppercase tracking-widest text-red-500">
        Closed
      </div>
    ) : (
      <div className="px-3 py-1.5 bg-muted border border-border rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        Closes {new Date(endsAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
      </div>
    )
  ) : null;

  const optionCount = poll.options.length;

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header pill */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/30 rounded-full animate-pulse">
          <span className="text-primary text-xs">⚡</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
            Community Poll
          </span>
        </span>
        {closedOrEnding}
      </div>

      {/* Question */}
      <h2 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight leading-tight">
        {poll.question}
      </h2>

      {/* Options */}
      <div className={`grid gap-3 ${optionCount >= 4 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
        {poll.options.map((option) => {
          const voteCount = votes[option.id] ?? 0;
          const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
          const isWinner =
            showResults &&
            voteCount === Math.max(...Object.values(votes));
          const isUserChoice = userVote === option.id;

          if (showResults) {
            // Results view
            return (
              <button
                key={option.id}
                onClick={() => handleVote(option.id)}
                disabled={loading || isClosed}
                className={`w-full space-y-1.5 text-left rounded-2xl p-3 transition-all ${
                  !isClosed ? "hover:bg-primary/5 cursor-pointer" : "cursor-default"
                } disabled:cursor-not-allowed`}
              >
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
              </button>
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
      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider pt-1 border-t border-border flex-wrap gap-2">
        <span>{total.toLocaleString()} {total === 1 ? "vote" : "votes"}</span>
        <div className="flex items-center gap-3">
          {!isLoggedIn && !isClosed && (
            <Link
              href="/login"
              className="text-primary font-black hover:underline transition-colors"
            >
              Sign in to vote
            </Link>
          )}
          {hasVoted && !isClosed && (
            <span className="text-muted-foreground/60 italic normal-case font-medium text-[9px]">
              Click an option to change your vote
            </span>
          )}
          {hasVoted && (
            <button
              onClick={handleShare}
              className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary font-black hover:bg-primary/20 transition-colors normal-case flex items-center gap-1.5"
            >
              {copied ? "✓ Saved!" : "⬇ Share Card"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
