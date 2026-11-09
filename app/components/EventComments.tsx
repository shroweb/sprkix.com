"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Reply, Trash2, Loader2, LogIn, Shield } from "lucide-react";
import UserAvatar from "@components/UserAvatar";

interface Author {
  id: string;
  name: string | null;
  slug: string;
  avatarUrl: string | null;
  isAdmin: boolean;
}
interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user: Author;
  replies?: Comment[];
}

const MAX = 1000;

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Composer({
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: {
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<string | null>;
  onCancel?: () => void;
  autoFocus?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || busy) return;
    setBusy(true);
    setError(null);
    const err = await onSubmit(text.trim());
    setBusy(false);
    if (err) setError(err);
    else setText("");
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, MAX))}
        placeholder={placeholder}
        rows={3}
        autoFocus={autoFocus}
        className="w-full resize-y border border-white/10 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">{text.length}/{MAX}</span>
        <div className="flex items-center gap-2">
          {error && <span className="text-xs font-semibold text-red-400" role="alert">{error}</span>}
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-3 py-2 text-sm font-semibold text-foreground/75 hover:text-foreground">
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || busy}
            className="inline-flex items-center gap-2 bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

export default function EventComments({
  eventId,
  user,
}: {
  eventId: string;
  user: { id: string; isAdmin?: boolean } | null;
}) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/comments`, { cache: "no-store" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setComments(data.comments ?? []);
      setLoadError(false);
    } catch {
      setLoadError(true);
      setComments((c) => c ?? []);
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const post = async (text: string, parentId?: string): Promise<string | null> => {
    const res = await fetch(`/api/events/${eventId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, parentId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return data.error || "Couldn't post your comment";
    const created: Comment = data.comment;
    setComments((cur) => {
      const list = cur ?? [];
      if (!parentId) return [created, ...list];
      return list.map((c) => (c.id === parentId ? { ...c, replies: [...(c.replies ?? []), created] } : c));
    });
    setReplyTo(null);
    return null;
  };

  const remove = async (commentId: string, parentId?: string) => {
    if (!window.confirm("Delete this comment?")) return;
    const res = await fetch(`/api/events/${eventId}/comments?commentId=${commentId}`, { method: "DELETE" });
    if (!res.ok) return;
    setComments((cur) =>
      (cur ?? [])
        .filter((c) => c.id !== commentId)
        .map((c) => (parentId && c.id === parentId ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== commentId) } : c)),
    );
  };

  const canDelete = (c: Comment) => !!user && (user.isAdmin || c.user.id === user.id);

  const renderItem = (c: Comment, parentId?: string): React.ReactNode => (
    <div key={c.id}>
      {renderBody(c, parentId)}
    </div>
  );

  const renderBody = (c: Comment, parentId?: string): React.ReactNode => (
    <div className="flex gap-3">
      <Link href={`/users/${c.user.slug}`} className="shrink-0">
        <UserAvatar name={c.user.name} avatarUrl={c.user.avatarUrl} size={parentId ? "sm" : "md"} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <Link href={`/users/${c.user.slug}`} className="text-sm font-bold hover:text-primary">
            {c.user.name || "Fan"}
          </Link>
          {c.user.isAdmin && (
            <span className="inline-flex items-center gap-1 bg-primary/10 px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
              <Shield className="h-3 w-3" /> Staff
            </span>
          )}
          <span className="text-xs text-muted-foreground">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{c.text}</p>
        <div className="mt-1.5 flex items-center gap-4">
          {!parentId && user && (
            <button
              type="button"
              onClick={() => setReplyTo(replyTo === c.id ? null : c.id)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary"
            >
              <Reply className="h-3.5 w-3.5" /> Reply
            </button>
          )}
          {canDelete(c) && (
            <button
              type="button"
              onClick={() => remove(c.id, parentId)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          )}
        </div>
        {!parentId && replyTo === c.id && (
          <div className="mt-3">
            <Composer placeholder={`Reply to ${c.user.name || "this comment"}…`} submitLabel="Reply" autoFocus onCancel={() => setReplyTo(null)} onSubmit={(t) => post(t, c.id)} />
          </div>
        )}
        {!parentId && (c.replies?.length ?? 0) > 0 && (
          <div className="mt-4 space-y-4 border-l border-white/10 pl-4">
            {c.replies!.map((r) => renderItem(r, c.id))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="space-y-6" aria-label="Event discussion">
      <div className="border border-white/10 bg-slate-950/70 p-4 sm:p-6">
        <h3 className="mb-3 flex items-center gap-2 text-base font-bold">
          <MessageSquare className="h-4 w-4 text-primary" /> Join the discussion
        </h3>
        {user ? (
          <Composer placeholder="What do you think about this event?" submitLabel="Post comment" onSubmit={(t) => post(t)} />
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 border border-primary/30 bg-primary/10 py-3 text-sm font-bold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            <LogIn className="h-4 w-4" /> Log in to leave a comment
          </Link>
        )}
      </div>

      <div className="border border-white/10 bg-slate-950/70 p-4 sm:p-6">
        {comments === null ? (
          <div className="flex justify-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        ) : loadError && comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load comments.{" "}
            <button type="button" onClick={load} className="font-semibold text-primary hover:underline">
              Try again
            </button>
          </p>
        ) : comments.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No comments yet. Be the first to say something.</p>
        ) : (
          <div className="space-y-6 divide-y divide-white/10 [&>*]:pt-6 [&>*:first-child]:pt-0">
            {comments.map((c) => renderItem(c))}
          </div>
        )}
      </div>
    </section>
  );
}
