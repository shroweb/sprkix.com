"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Star,
  Trash2,
  Pencil,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Loader2,
  Share2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ShareReviewButton from "./ShareReviewButton";

type Reply = {
  id: string;
  comment: string;
  createdAt: string;
  user: { id: string; name: string | null; slug: string };
};
type Review = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  event: { title: string; slug: string; posterUrl: string | null; promotion: string };
  Reply: Reply[];
};

export default function ProfileReviews({
  reviews: initialReviews,
}: {
  reviews: Review[];
}) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initialReviews);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set(),
  );

  const handleDelete = async (reviewId: string) => {
    if (!confirm("Delete this review?")) return;
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: "DELETE" });
      if (res.ok) {
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
        router.refresh();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setEditRating(review.rating);
    setEditComment(review.comment ?? "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRating(0);
    setEditComment("");
  };

  const handleSaveEdit = async (reviewId: string) => {
    setSavingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: editRating, comment: editComment }),
      });
      if (res.ok) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? { ...r, rating: editRating, comment: editComment }
              : r,
          ),
        );
        setEditingId(null);
      }
    } finally {
      setSavingId(null);
    }
  };

  const toggleReplies = (reviewId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      next.has(reviewId) ? next.delete(reviewId) : next.add(reviewId);
      return next;
    });
  };

  if (reviews.length === 0) {
    return (
      <div className="bg-card/20 border border-dashed border-border rounded-[2rem] p-16 text-center">
        <Star className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
        <p className="text-muted-foreground font-bold italic">
          You haven&apos;t reviewed any events yet.
        </p>
        <Link href="/events" className="btn-primary inline-block mt-4 text-sm">
          Browse Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => {
        const isEditing = editingId === review.id;
        const isDeleting = deletingId === review.id;
        const isSaving = savingId === review.id;
        const repliesOpen = expandedReplies.has(review.id);

        return (
          <div
            key={review.id}
            className="bg-card/40 border border-white/5 rounded-2xl overflow-hidden hover:border-primary/10 transition-all"
          >
            {/* Main row */}
            <div className="flex gap-5 p-5">
              {/* Poster */}
              <Link href={`/events/${review.event.slug}`} className="shrink-0">
                <div className="relative w-14 aspect-[2/3] rounded-xl overflow-hidden border border-white/5">
                  <Image
                    src={review.event.posterUrl || "/placeholder.svg"}
                    alt={review.event.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <Link
                    href={`/events/${review.event.slug}`}
                    className="font-black text-sm uppercase italic tracking-tight hover:text-primary transition-colors leading-tight line-clamp-2 group"
                  >
                    {review.event.title.replace(/–\s\d{4}.*$/, "")}
                  </Link>
                  <span className="text-[10px] font-black text-muted-foreground shrink-0">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                {isEditing ? (
                  /* ── Edit mode ── */
                  <div className="space-y-3 pt-1">
                    {/* Star picker */}
                    <div className="flex gap-1.5 mb-2">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isFull = editRating >= s;
                        const isHalf = editRating >= s - 0.5 && editRating < s;
                        return (
                          <div key={s} className="relative group/star active:scale-90 transition-transform">
                            <div 
                              className="absolute inset-0 z-10 flex"
                              onClick={(e) => {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const x = e.clientX - rect.left;
                                  setEditRating(x < rect.width / 2 ? s - 0.5 : s);
                              }}
                            >
                              <div className="flex-1 cursor-pointer" />
                              <div className="flex-1 cursor-pointer" />
                            </div>
                            <div className="relative">
                              <Star className="w-6 h-6 text-muted-foreground/20" />
                              {isFull ? (
                                <Star className="absolute inset-0 w-6 h-6 text-primary fill-current" />
                              ) : isHalf ? (
                                <div className="absolute inset-0 w-[50%] overflow-hidden">
                                  <Star className="w-6 h-6 text-primary fill-current" />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <textarea
                      value={editComment}
                      onChange={(e) => setEditComment(e.target.value)}
                      rows={2}
                      className="w-full bg-white border border-border rounded-xl p-3 text-sm font-bold text-slate-900 outline-none focus:border-primary/50 transition-all resize-none"
                      placeholder="Your review..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(review.id)}
                        disabled={isSaving || editRating === 0}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-black text-xs font-black rounded-lg disabled:opacity-50"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Save
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-secondary text-xs font-black rounded-lg hover:bg-muted transition-colors"
                      >
                        <X className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── View mode ── */
                  <>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => {
                        const isFull = review.rating >= s;
                        const isHalf = review.rating >= s - 0.5 && review.rating < s;
                        return (
                          <div key={s} className="relative w-3 h-3">
                            <Star className="w-3 h-3 text-muted-foreground/20" />
                            {isFull ? (
                              <Star className="absolute inset-0 w-3 h-3 text-primary fill-current" />
                            ) : isHalf ? (
                              <div className="absolute inset-0 w-[50%] overflow-hidden">
                                <Star className="w-3 h-3 text-primary fill-current" />
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                    {review.comment && (
                      <p className="text-sm text-foreground/60 font-medium italic line-clamp-2">
                        {review.comment}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              {!isEditing && (
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(review)}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all"
                    title="Edit review"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all disabled:opacity-50"
                    title="Delete review"
                  >
                    {isDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ShareReviewButton
                    review={review}
                    event={review.event}
                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90"
                  />
                </div>
              )}
            </div>

            {/* Replies section */}
            {review.Reply.length > 0 && (
              <div className="border-t border-white/5">
                <button
                  onClick={() => toggleReplies(review.id)}
                  className="w-full flex items-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {review.Reply.length}{" "}
                  {review.Reply.length === 1 ? "Reply" : "Replies"}
                  {repliesOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 ml-auto" />
                  )}
                </button>

                {repliesOpen && (
                  <div className="px-5 pb-4 space-y-2">
                    {review.Reply.map((reply) => (
                      <div
                        key={reply.id}
                        className="flex gap-3 bg-secondary/30 rounded-xl p-3"
                      >
                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[9px] font-black shrink-0">
                          {reply.user.name?.charAt(0).toUpperCase() ?? "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/users/${reply.user.slug || reply.user.id}`}
                            className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest"
                          >
                            {reply.user.name}
                          </Link>
                          <p className="text-xs text-muted-foreground font-medium italic mt-0.5">
                            {reply.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
