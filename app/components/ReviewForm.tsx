"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";

import ShareReviewModal from "./ShareReviewModal";

export default function ReviewForm({
  event,
  user,
  isUpcoming,
  initialReview,
}: {
  event: { id: string; title: string; posterUrl: string | null; promotion: string };
  user: any;
  isUpcoming?: boolean;
  initialReview?: { rating: number; comment: string | null } | null;
}) {
  const [comment, setComment] = useState(initialReview?.comment || "");
  const [rating, setRating] = useState(initialReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [lastReview, setLastReview] = useState<{ rating: number; comment: string | null } | null>(null);
  const router = useRouter();

  // Sync state if initialReview changes (from router.refresh)
  useEffect(() => {
    if (initialReview) {
      setComment(initialReview.comment || "");
      setRating(initialReview.rating || 0);
    }
  }, [initialReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: event.id,
          rating: isUpcoming ? null : rating,
          comment,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSubmitError(data.error ?? "Failed to post review. Please try again.");
        return;
      }

      setLastReview({ rating, comment: comment || null });
      setShowShareModal(true);
      router.refresh();
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <textarea
            className="w-full bg-white border border-border rounded-xl p-4 text-sm font-bold text-slate-900 outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground placeholder:italic resize-none"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder={
              isUpcoming ? "Write your comment..." : "What did you think of the show?..."
            }
          />
          
          {!isUpcoming && (
            <div className="flex flex-col gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Your Rating
                </span>
                <div className="flex gap-1.5" onMouseLeave={() => setHoveredRating(null)}>
                    {[1, 2, 3, 4, 5].map((s) => {
                      const displayRating = hoveredRating ?? rating;
                      return (
                        <div key={s} className="relative group/star active:scale-90 transition-transform">
                          <div 
                            className="absolute inset-0 z-10 flex"
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                let val = s;
                                if (percent < 0.25) val = s - 0.75;
                                else if (percent < 0.5) val = s - 0.5;
                                else if (percent < 0.75) val = s - 0.25;
                                setHoveredRating(val);
                            }}
                            onClick={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left;
                                const percent = x / rect.width;
                                let val = s;
                                if (percent < 0.25) val = s - 0.75;
                                else if (percent < 0.5) val = s - 0.5;
                                else if (percent < 0.75) val = s - 0.25;
                                setRating(val);
                            }}
                          >
                            <div className="flex-1 cursor-pointer" />
                          </div>
                          <div className="relative">
                            <Star className="w-8 h-8 text-muted-foreground/20" />
                            {(() => {
                              const diff = displayRating - (s - 1);
                              if (diff >= 1) return <Star className="absolute inset-0 w-8 h-8 text-primary fill-current transition-all duration-200" />;
                              if (diff <= 0) return null;
                              return (
                                <div className="absolute inset-0 overflow-hidden transition-all duration-200" style={{ width: `${diff * 100}%` }}>
                                  <Star className="w-8 h-8 text-primary fill-current" />
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                </div>
            </div>
          )}
        </div>

        {submitError && (
          <p className="text-xs font-bold text-destructive bg-destructive/10 px-4 py-3 rounded-xl">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || (!isUpcoming && rating === 0)}
          className="w-full h-14 bg-primary hover:bg-teal-400 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          {submitting ? (isUpcoming ? "Posting..." : "Reviewing...") : (initialReview ? "Update Review" : (isUpcoming ? "Post Comment" : "Post Review"))}
        </button>
      </form>

      {lastReview && (
        <ShareReviewModal 
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            review={lastReview}
            event={event}
        />
      )}
    </>
  );
}
