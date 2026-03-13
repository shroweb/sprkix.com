"use client";
import React from "react";
import { Star } from "lucide-react";

interface VisualRatingProps {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  showNumber?: boolean;
}

export default function VisualRating({
  rating,
  size = "sm",
  className = "",
  showNumber = false,
}: VisualRatingProps) {
  const stars = [1, 2, 3, 4, 5];
  
  const sizeClasses = {
    xs: "w-3 h-3",
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  };

  const iconSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <div className="flex gap-0.5">
        {stars.map((s) => {
          const diff = rating - (s - 1);
          return (
            <div key={s} className="relative">
              <Star className={`${iconSize} text-muted-foreground/20`} />
              {diff >= 1 ? (
                <Star className={`absolute inset-0 ${iconSize} text-primary fill-current`} />
              ) : diff > 0 ? (
                <div 
                  className="absolute inset-0 overflow-hidden" 
                  style={{ width: `${diff * 100}%` }}
                >
                  <Star className={`${iconSize} text-primary fill-current`} />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-black italic text-primary ml-1">
          {rating.toFixed(2)}
        </span>
      )}
    </div>
  );
}
