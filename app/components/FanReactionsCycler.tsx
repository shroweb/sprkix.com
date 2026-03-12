"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import ReviewUpvote from "./ReviewUpvote";
import ReplyForm from "./ReplyForm";

export default function FanReactionsCycler({
  reviews,
  user,
  userId,
}: {
  reviews: any[];
  user: any;
  userId?: string;
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!reviews || reviews.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 10000); // 10 seconds per fan reaction
    return () => clearInterval(timer);
  }, [reviews]);

  if (!reviews || reviews.length === 0) return null;

  const review = reviews[index];
  if (!review) return null;

  return (
    <div className="relative min-h-[220px]">
      {reviews.map((r, i) => (
        <div
          key={r.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            i === index
              ? "opacity-100 z-10 pointer-events-auto"
              : "opacity-0 z-0 pointer-events-none"
          }`}
        >
          <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary/30 transition-colors h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <Link
                href={`/users/${r.user?.id}`}
                className="flex items-center gap-3 hover:text-primary transition-colors group/user"
              >
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-black group-hover/user:bg-primary group-hover/user:text-black transition-colors">
                  {r.user?.name ? r.user.name.charAt(0).toUpperCase() : "A"}
                </div>
                <span className="text-sm font-black italic">
                  {r.user?.name || "Anonymous"}
                </span>
              </Link>
              <div className="flex text-primary">
                <Star className="w-3 h-3 fill-current" />
                <span className="text-xs font-black ml-1">{r.rating}</span>
              </div>
            </div>
            <p className="text-sm text-foreground/80 font-medium italic leading-relaxed flex-1">
              "{r.comment}"
            </p>

            {r.Reply?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border space-y-3">
                {r.Reply.slice(0, 1).map((reply: any) => (
                  <div
                    key={reply.id}
                    className="flex gap-3 text-xs bg-secondary/50 p-3 rounded-xl italic"
                  >
                    <span className="font-black text-primary uppercase">
                      {reply.user?.name}
                    </span>
                    <span className="text-muted-foreground">
                      {reply.comment}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex items-center justify-between">
              {user && <ReplyForm reviewId={r.id} />}
              <ReviewUpvote
                reviewId={r.id}
                initialCount={r.votes?.length || 0}
                initialVoted={r.votes?.some((v: any) => v.userId === userId)}
                isLoggedIn={!!user}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
