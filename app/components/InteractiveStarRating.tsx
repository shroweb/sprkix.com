"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface InteractiveStarRatingProps {
  initialRating?: number;
  onRate?: (rating: number) => void;
  maxStars?: number;
  readOnly?: boolean;
}

const RATING_LABELS: Record<number, string> = {
  1: "1.0 - Poor",
  2: "2.0 - Below Average",
  3: "3.0 - Good",
  4: "4.0 - Great Match",
  5: "5.0 - All-Time Classic",
};

export default function InteractiveStarRating({
  initialRating = 0,
  onRate,
  maxStars = 5,
  readOnly = false,
}: InteractiveStarRatingProps) {
  const [rating, setRating] = useState(initialRating);
  const [hoverRating, setHoverRating] = useState(0);

  const activeRating = hoverRating || rating;

  const handleClick = (selected: number) => {
    if (readOnly) return;
    setRating(selected);
    if (onRate) onRate(selected);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: maxStars }).map((_, idx) => {
          const starValue = idx + 1;
          const isFilled = starValue <= activeRating;

          return (
            <button
              key={starValue}
              type="button"
              disabled={readOnly}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => !readOnly && setHoverRating(starValue)}
              onMouseLeave={() => !readOnly && setHoverRating(0)}
              className={`p-1 rounded-lg transition-transform duration-150 ${
                readOnly
                  ? "cursor-default"
                  : "cursor-pointer hover:scale-125 active:scale-95"
              }`}
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-700 fill-slate-800/40"
                }`}
              />
            </button>
          );
        })}
      </div>
      {activeRating > 0 && (
        <span className="text-xs font-semibold text-amber-400 animate-fadeIn">
          {RATING_LABELS[activeRating] || `${activeRating}.0 Stars`}
        </span>
      )}
    </div>
  );
}
