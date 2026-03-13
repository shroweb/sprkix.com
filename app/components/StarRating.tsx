// components/StarRating.tsx
"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import { useRouter } from "next/navigation";

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

  const router = useRouter();

  const handleClick = async (val: number) => {
    if (!user || !user.id || !matchId) return;
    const finalRating = val;

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
        router.refresh();
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
                    const percent = x / rect.width;
                    let val = s;
                    if (percent < 0.25) val = s - 0.75;
                    else if (percent < 0.5) val = s - 0.5;
                    else if (percent < 0.75) val = s - 0.25;
                    setHovered(val);
                }}
                onClick={(e) => {
                    if (!user) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const percent = x / rect.width;
                    let val = s;
                    if (percent < 0.25) val = s - 0.75;
                    else if (percent < 0.5) val = s - 0.5;
                    else if (percent < 0.75) val = s - 0.25;
                    handleClick(val);
                }}
              >
                <div className="flex-1" />
              </div>

              <div className="relative">
                <Star className="w-4 h-4 text-slate-300" />
                {(() => {
                  const val = hovered ?? rating;
                  const diff = val - (s - 1);
                  if (diff >= 1) return <Star className="absolute inset-0 w-4 h-4 text-primary fill-current" />;
                  if (diff <= 0) return null;
                  return (
                    <div className="absolute inset-0 overflow-hidden" style={{ width: `${diff * 100}%` }}>
                      <Star className="w-4 h-4 text-primary fill-current" />
                    </div>
                  );
                })()}
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
