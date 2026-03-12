"use client";

import { useState, useEffect } from "react";

export default function HeroReviewCycler({ reviews }: { reviews: any[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!reviews || reviews.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews]);

  if (!reviews || reviews.length === 0) return null;

  const review = reviews[index];
  if (!review?.comment) return null;

  return (
    <div className="relative h-[48px] overflow-hidden">
      {reviews.map((r, i) => (
        <p
          key={r.id || i}
          className={`absolute inset-0 text-xs text-white/60 font-medium italic leading-relaxed line-clamp-2 border-l-2 border-primary/50 pl-3 transition-opacity duration-1000 ${
            i === index ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          "{r.comment}"
        </p>
      ))}
    </div>
  );
}
