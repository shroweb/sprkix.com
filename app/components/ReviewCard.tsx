"use client";

import { Review, Reply, User } from "@prisma/client";
import ReplyForm from "../components/ReplyForm";
import Link from "next/link";
import ShareReviewButton from "./ShareReviewButton";
import UserAvatar from "./UserAvatar";

type FullReview = Review & {
  user: User;
  Reply: (Reply & { user: User })[];
};

export default function ReviewCard({
  review,
  user,
  event,
  highlighted = false,
}: {
  review: FullReview;
  user?: User | null;
  event?: { title: string; posterUrl: string | null; promotion: string };
  highlighted?: boolean;
}) {
  return (
    <div 
      id={`review-${review.id}`}
      className={`bg-card border rounded-2xl p-6 transition-all relative group ${
        highlighted 
          ? "border-primary ring-1 ring-primary/20 shadow-lg shadow-primary/5" 
          : "border-border hover:border-primary/30"
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/users/${review.user.slug || review.user.id}`} className="flex items-center gap-3 hover:text-primary transition-colors">
            <UserAvatar name={review.user.name} avatarUrl={(review.user as any).avatarUrl} size="md" />
            <span className="text-sm font-black italic">{review.user.name || "Anonymous"}</span>
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-muted-foreground">
            {new Date(review.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
          <div className="flex items-center gap-1.5 text-primary">
            <span className="w-3.5 h-3.5 flex items-center justify-center">★</span>
            <span className="text-sm font-black text-primary">{review.rating.toFixed(2)}</span>
          </div>
          {event && (
            <ShareReviewButton 
              review={review} 
              event={event} 
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all active:scale-90"
            />
          )}
        </div>
      </div>

      <p className="text-sm text-foreground/80 font-medium italic leading-relaxed">
        "{review.comment}"
      </p>

      {review.Reply && review.Reply.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-3">
          {review.Reply.map((reply) => (
            <div
              key={reply.id}
              className="w-full flex items-start gap-3 p-3 bg-secondary/50 rounded-xl italic"
            >
              <div className="flex-shrink-0">
                <UserAvatar name={reply.user.name} avatarUrl={(reply.user as any).avatarUrl} size="sm" />
              </div>
              {/* User Info & Rating */}
              <div className="flex flex-col gap-1 flex-grow text-xs leading-snug">
                <div className="flex items-baseline gap-2">
                  <span className="font-black text-primary uppercase">
                    {reply.user.name}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
                <p className="text-muted-foreground">{reply.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 w-full">
        {user ? <ReplyForm reviewId={review.id} /> : <div />}
      </div>
    </div>
  );
}
