// components/StarRating.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";

interface StarRatingProps {
  matchId: string;
  initialRating: number;
  averageRating: number;
  user: any;
  showAverage?: boolean;
  hideStarLabel?: boolean;
}

export default function StarRating({
  matchId,
  initialRating,
  averageRating,
  user,
  showAverage = true,
  hideStarLabel = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5];

  const [rating, setRating] = useState(initialRating);
  const [hovered, setHovered] = useState<number | null>(null);
  const [avg, setAvg] = useState(averageRating);

  // Sync when props change (e.g. different match selected)
  useEffect(() => {
    setRating(initialRating);
  }, [initialRating, matchId]);

  useEffect(() => {
    setAvg(averageRating);
  }, [averageRating]);

  const handleClick = async (star: number, isHalf: boolean) => {
    if (!user || !user.id || !matchId) return;
    const finalRating = isHalf ? star - 0.5 : star;

    try {
      setRating(finalRating);
      const res = await fetch(`/api/matches/${matchId}/rate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: finalRating, matchId, userId: user.id }),
      });

      if (res.ok) {
        const data = await res.json();
        setAvg(data.average);
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div 
        className="flex gap-0.5"
        onMouseLeave={() => setHovered(null)}
      >
        {stars.map((s) => {
          const isFull = (hovered ?? rating) >= s;
          const isHalf = (hovered ?? rating) >= s - 0.5 && (hovered ?? rating) < s;
          
          return (
            <div 
                key={s} 
                className="relative cursor-pointer transition-transform active:scale-90"
            >
              <div 
                className="absolute inset-0 z-10 flex"
                onMouseMove={(e) => {
                    if (!user) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    setHovered(x < rect.width / 2 ? s - 0.5 : s);
                }}
                onClick={(e) => {
                    if (!user) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    handleClick(s, x < rect.width / 2);
                }}
              >
                <div className="flex-1" />
                <div className="flex-1" />
              </div>

              <div className="relative">
                <Star className="w-4 h-4 text-slate-300" />
                {isFull ? (
                  <Star className="absolute inset-0 w-4 h-4 text-primary fill-current transition-all duration-150" />
                ) : isHalf ? (
                  <div className="absolute inset-0 w-[50%] overflow-hidden transition-all duration-150">
                    <Star className="w-4 h-4 text-primary fill-current" />
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {showAverage && avg !== null && (
        <span className="text-[11px] font-black italic tracking-tighter opacity-50 mt-1">
          {!hideStarLabel && "COMMUNITY: "}
          {avg.toFixed(2)}
        </span>
      )}
    </div>
  );
}
