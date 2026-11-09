"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X, Target, Star, Trophy } from "lucide-react";
import { POST_AUTH_COOKIE } from "@lib/auth-redirect";

export type SignUpReason = "predict" | "rate" | "follow" | "generic";

const COPY: Record<SignUpReason, { title: string; body: string }> = {
  predict: {
    title: "Save your pick",
    body: "Create a free account to lock in your prediction, climb the leaderboard and get told when you called it.",
  },
  rate: {
    title: "Rate this match",
    body: "Create a free account to rate matches, write reviews and build your own wrestling profile.",
  },
  follow: {
    title: "Follow fans you like",
    body: "Create a free account to follow other fans and see their ratings and reviews in your feed.",
  },
  generic: {
    title: "Join Poison Rana",
    body: "Create a free account to rate matches, make predictions and review shows.",
  },
};

/** Remember where to send the user once they've signed in (read by OAuth callbacks). */
function rememberReturnPath(path: string) {
  try {
    document.cookie = `${POST_AUTH_COOKIE}=${encodeURIComponent(path)}; path=/; max-age=900; SameSite=Lax`;
  } catch {
    /* cookies blocked — user lands on the home page after sign-in */
  }
}

export default function SignUpPrompt({
  open,
  onClose,
  reason = "generic",
}: {
  open: boolean;
  onClose: () => void;
  reason?: SignUpReason;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  const returnTo = window.location.pathname + window.location.search;
  const next = encodeURIComponent(returnTo);
  const { title, body } = COPY[reason];

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        // Portal events still bubble through the React tree — keep them away from clickable parents.
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="relative w-full max-w-md rounded-3xl border border-primary/30 bg-card p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-2xl font-black italic uppercase tracking-tighter pr-8">{title}</h2>
        <p className="text-sm text-muted-foreground font-medium mt-2">{body}</p>

        <ul className="mt-5 space-y-2 text-xs font-bold text-foreground/80">
          <li className="flex items-center gap-2"><Target className="w-3.5 h-3.5 text-primary" /> Predict winners and track your accuracy</li>
          <li className="flex items-center gap-2"><Star className="w-3.5 h-3.5 text-primary" /> Rate matches and review shows</li>
          <li className="flex items-center gap-2"><Trophy className="w-3.5 h-3.5 text-primary" /> Earn ranks and badges</li>
        </ul>

        <div className="mt-6 flex flex-col gap-2">
          <Link
            href={`/register?next=${next}`}
            onClick={() => rememberReturnPath(returnTo)}
            className="h-12 bg-primary text-black text-sm font-bold uppercase tracking-wider flex items-center justify-center rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
          >
            Create free account
          </Link>
          <Link
            href={`/login?next=${next}`}
            onClick={() => rememberReturnPath(returnTo)}
            className="h-11 border border-white/10 text-sm font-bold flex items-center justify-center rounded-xl hover:border-primary/40 transition-colors"
          >
            I already have an account
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
