"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import * as htmlToImage from "html-to-image";
import { Download, Share2, X, Loader2 } from "lucide-react";

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
  const [shareOpen, setShareOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const isClosed = endsAt ? new Date(endsAt) < new Date() : false;
  const hasVoted = !!userVote;
  const showResults = hasVoted || isClosed;

  const maxVotes = Math.max(...Object.values(votes), 1);

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

  const generateImage = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    setIsGenerating(true);
    try {
      return await htmlToImage.toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });
    } catch (err) {
      console.error("Failed to generate image", err);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.download = `poll-${poll.id}.png`;
    link.href = dataUrl;
    link.click();
  };

  const handleNativeShare = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], `poll-${poll.id}.png`, { type: "image/png" });
    const shareText = `"${poll.question}" — vote on poisonrana.com`;
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: "Community Poll", text: shareText });
    } else {
      const link = document.createElement("a");
      link.download = file.name;
      link.href = dataUrl;
      link.click();
    }
  };

  const openUrl = (url: string) => window.open(url, "_blank", "noopener,noreferrer");
  const shareText = `"${poll.question}" — vote on poisonrana.com`;
  const shareUrl = "https://poisonrana.com";

  const socialButtons = [
    {
      label: "Twitter / X",
      color: "bg-black border border-white/10 hover:border-white/30",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      onClick: () => openUrl(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`),
    },
    {
      label: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166de0]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      onClick: () => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`),
    },
    {
      label: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20bc5a]",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      onClick: () => openUrl(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`),
    },
    {
      label: "Share / Stories",
      color: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90",
      icon: (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      ),
      onClick: handleNativeShare,
    },
  ];

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
    <>
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
                onClick={() => setShareOpen(true)}
                className="px-3 py-1.5 bg-primary/10 border border-primary/30 rounded-full text-primary font-black hover:bg-primary/20 transition-colors normal-case flex items-center gap-1.5"
              >
                <Share2 className="w-3 h-3" /> Share Card
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Share modal */}
      {shareOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShareOpen(false)} />

          <div className="relative z-10 w-full max-w-sm space-y-6 animate-in zoom-in-95 duration-300 py-8">
            {/* Share card — 9:16 story format */}
            <div
              ref={cardRef}
              style={{ aspectRatio: "9/16", background: "#0d0d14" }}
              className="w-full rounded-[2.5rem] overflow-hidden relative border border-white/10 shadow-2xl flex flex-col"
            >
              {/* Amber top bar */}
              <div className="h-2 w-full bg-primary shrink-0" />

              {/* Glow accent */}
              <div
                className="absolute top-0 left-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none"
                style={{ background: "rgba(251,191,36,0.15)" }}
              />

              <div className="relative z-10 flex flex-col h-full px-8 py-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/img/logo.png" alt="Sprkix" style={{ height: 40, width: "auto", objectFit: "contain" }} />
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 12, color: "#fbbf24" }}>⚡</span>
                    <span style={{ fontSize: 11, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "0.18em", color: "rgba(251,191,36,0.85)" }}>
                      Community Poll
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div className="mt-10 mb-10">
                  <p style={{ fontSize: 28, fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "white", lineHeight: 1.1, letterSpacing: "-0.02em" }}>
                    {poll.question}
                  </p>
                </div>

                {/* Results bars */}
                <div className="space-y-3 flex-1">
                  {poll.options.map((option) => {
                    const voteCount = votes[option.id] ?? 0;
                    const pct = total > 0 ? Math.round((voteCount / total) * 100) : 0;
                    const isWinner = voteCount === maxVotes && maxVotes > 0;
                    const isUserChoice = userVote === option.id;
                    const barColor = isUserChoice
                      ? "#fbbf24"
                      : isWinner
                      ? "rgba(251,191,36,0.5)"
                      : "rgba(255,255,255,0.15)";

                    return (
                      <div key={option.id} className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span style={{
                            fontSize: 11,
                            fontWeight: 900,
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            color: isUserChoice ? "#fbbf24" : "white",
                          }}>
                            {option.text}{isUserChoice ? "  ✓" : ""}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 900, color: isUserChoice ? "#fbbf24" : "rgba(255,255,255,0.5)" }}>
                            {pct}%
                          </span>
                        </div>
                        <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: barColor,
                            borderRadius: 999,
                          }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)" }}>
                    {total.toLocaleString()} {total === 1 ? "vote" : "votes"}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(251,191,36,0.6)", fontStyle: "italic" }}>
                    poisonrana.com
                  </span>
                </div>
              </div>
            </div>

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="w-full flex items-center justify-center gap-3 py-4 bg-primary text-black font-black uppercase italic tracking-widest rounded-2xl shadow-2xl shadow-primary/20 hover:bg-teal-400 hover:shadow-teal-400/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              {isGenerating ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-5 h-5" /> Save Image</>
              )}
            </button>

            {/* Social row */}
            <div className="grid grid-cols-4 gap-2">
              {socialButtons.map(({ label, color, icon, onClick }) => (
                <button
                  key={label}
                  onClick={onClick}
                  title={label}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl text-white transition-all hover:scale-105 active:scale-95 ${color}`}
                >
                  {icon}
                  <span className="text-[8px] font-black uppercase tracking-wide leading-none opacity-80">{label.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            <button
              onClick={() => setShareOpen(false)}
              className="w-full flex items-center justify-center gap-2 py-3 bg-white/10 text-white font-black uppercase italic tracking-widest rounded-2xl hover:bg-white/20 transition-all"
            >
              <X className="w-4 h-4" /> Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
