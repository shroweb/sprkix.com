"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageSquare, Send, Shield, User, LogIn, Zap } from "lucide-react";
import Link from "next/link";

interface LiveComment {
  id: string;
  text: string;
  createdAt: string;
  user: {
    name: string;
    avatarUrl?: string;
    isAdmin: boolean;
  };
}

export default function LiveChatContainer({
  eventId,
  user,
  fullWidth = false,
  readOnly = false,
}: {
  eventId: string;
  user: any;
  fullWidth?: boolean;
  readOnly?: boolean;
}) {
  const [comments, setComments] = useState<LiveComment[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reacting, setReacting] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tracks IDs of optimistic messages still in-flight — poll skips updates while non-empty
  const pendingIds = useRef<Set<string>>(new Set());
  const isAtBottom = useRef(true);

  const scrollToBottom = (force = false) => {
    if (scrollRef.current && (isAtBottom.current || force)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    isAtBottom.current = scrollHeight - scrollTop - clientHeight < 60;
  };

  const fetchComments = useCallback(async () => {
    // Don't overwrite state while a message POST is still in-flight
    if (pendingIds.current.size > 0) return;
    try {
      const res = await fetch(`/api/events/${eventId}/chat`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch { /* silent */ }
  }, [eventId]);

  useEffect(() => {
    fetchComments();
    // Read-only (archived) — load once, no need to keep polling
    if (!readOnly) {
      pollRef.current = setInterval(fetchComments, 5000);
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchComments, readOnly]);

  useEffect(() => {
    scrollToBottom();
  }, [comments]);

  const postMessage = async (text: string) => {
    if (!text.trim() || !user) return;

    const tempId = `opt-${Date.now()}-${Math.random()}`;
    pendingIds.current.add(tempId);

    const optimistic: LiveComment = {
      id: tempId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      user: { name: user.name, avatarUrl: user.avatarUrl, isAdmin: user.isAdmin || false },
    };
    setComments(prev => [...prev, optimistic]);
    scrollToBottom(true);

    try {
      const res = await fetch(`/api/events/${eventId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments(prev =>
          prev.map(c => c.id === tempId ? data.comment : c)
        );
      } else {
        setComments(prev => prev.filter(c => c.id !== tempId));
      }
    } catch {
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      pendingIds.current.delete(tempId);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !inputText.trim()) return;
    setIsSubmitting(true);
    const text = inputText;
    setInputText("");
    await postMessage(text);
    setIsSubmitting(false);
  };

  const sendReaction = async (emoji: string, label: string) => {
    if (!user || reacting) return;
    setReacting(emoji);
    await postMessage(`${label} ${emoji}`);
    setTimeout(() => setReacting(null), 1200);
  };

  const REACTIONS = [
    { emoji: "😱", label: "OMG!" },
    { emoji: "🔥", label: "FIRE!" },
    { emoji: "💎", label: "PEAK WRESTLING!" },
    { emoji: "🤮", label: "AWFUL..." },
    { emoji: "👏", label: "LETS GO!" },
  ];

  // Count how many times each reaction has been posted
  const reactionCounts = REACTIONS.reduce<Record<string, number>>((acc, { emoji, label }) => {
    acc[emoji] = comments.filter(c =>
      c.text === `${label} ${emoji}` || c.text.startsWith(`${label} ${emoji}`)
    ).length;
    return acc;
  }, {});

  const containerHeight = fullWidth ? "h-[500px]" : "h-[620px]";

  return (
    <div className={`flex flex-col bg-card/60 backdrop-blur-xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl ${containerHeight}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-red-500/10 via-transparent to-transparent">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center">
              <Zap className="w-4 h-4 text-red-400" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-background" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase italic tracking-tighter">Watch Party Chat</h3>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {comments.length > 0
                ? `${comments.length} message${comments.length === 1 ? "" : "s"}`
                : readOnly ? "No messages were recorded" : "Be the first to react"}
            </p>
          </div>
        </div>
        {readOnly ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Archived</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {/* Message Feed */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-hide"
      >
        {comments.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-25 text-center px-10 gap-4">
            <MessageSquare className="w-14 h-14" />
            <p className="text-sm font-black italic uppercase tracking-tighter">The arena is quiet… be the first to roar!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isPending = comment.id.startsWith("opt-");
            return (
              <div
                key={comment.id}
                className={`flex gap-3 group transition-opacity ${isPending ? "opacity-55" : "animate-in slide-in-from-bottom-2 duration-300"}`}
              >
                <div className="shrink-0 mt-0.5">
                  {comment.user.avatarUrl ? (
                    <img
                      src={comment.user.avatarUrl}
                      className="w-7 h-7 rounded-full object-cover border border-white/10"
                      alt=""
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${comment.user.isAdmin ? "bg-primary/20" : "bg-secondary"}`}>
                      {comment.user.isAdmin
                        ? <Shield className="w-3.5 h-3.5 text-primary" />
                        : <User className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className={`text-[11px] font-black uppercase italic tracking-tight leading-none ${comment.user.isAdmin ? "text-primary" : "text-white/80"}`}>
                      {comment.user.name}
                      {comment.user.isAdmin && (
                        <span className="ml-1 text-[8px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-black uppercase tracking-wider not-italic">Admin</span>
                      )}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground/40 shrink-0">
                      {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground/85 leading-snug break-words">
                    {comment.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Reactions — hidden when archived */}
      {!readOnly && (
        <div className="px-4 py-2.5 border-t border-white/5 flex gap-2 justify-center bg-white/3 flex-wrap">
          {REACTIONS.map(({ emoji, label }) => {
            const count = reactionCounts[emoji] ?? 0;
            return (
              <button
                key={emoji}
                onClick={() => sendReaction(emoji, label)}
                disabled={!user || !!reacting}
                title={user ? label : "Login to react"}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-sm transition-all duration-150 ${
                  reacting === emoji
                    ? "bg-primary/20 border-primary scale-125 shadow-lg shadow-primary/20"
                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:-translate-y-0.5 active:scale-95"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <span>{emoji}</span>
                {count > 0 && (
                  <span className="text-[10px] font-black text-muted-foreground/70 leading-none">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Input / Read-only notice */}
      <div className="p-4 bg-secondary/20 border-t border-white/5">
        {readOnly ? (
          <p className="text-center text-[11px] font-bold text-muted-foreground/50 uppercase tracking-widest py-1">
            This event has ended — chat is read-only
          </p>
        ) : user ? (
          <form onSubmit={handlePost} className="relative">
            <input
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="React to the action…"
              maxLength={500}
              autoComplete="off"
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/30 transition-all font-medium placeholder:text-muted-foreground/40"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSubmitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-primary text-black rounded-xl hover:bg-[var(--primary-hover)] hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest hover:bg-[var(--primary-hover)] hover:text-black hover:border-[var(--primary-hover)] transition-all group"
          >
            <LogIn className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            Login to join the watch party
          </Link>
        )}
      </div>
    </div>
  );
}
