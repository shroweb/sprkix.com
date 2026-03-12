"use client";
import { useState } from "react";

export default function MatchRating({
  matchId,
  userRating,
  canRate = false,
}: {
  matchId: string;
  userRating?: number;
  canRate?: boolean;
}) {
  const [rating, setRating] = useState(userRating || 0);
  const [hover, setHover] = useState(0);

  async function rate(star: number) {
    setRating(star);
    const res = await fetch(`/api/matches/${matchId}/rate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: star }),
    });
    if (!res.ok) {
      console.error("Rating failed");
    }
  }

  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`cursor-pointer text-2xl ${
            (hover || rating) >= star ? "text-yellow-400" : "text-gray-300"
          }`}
          onMouseEnter={() => canRate && setHover(star)}
          onMouseLeave={() => canRate && setHover(0)}
          onClick={() => canRate && rate(star)}
        >
          ★
        </span>
      ))}
    </div>
  );
}
