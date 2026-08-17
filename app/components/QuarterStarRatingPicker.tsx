"use client";

import { useState } from "react";
import { Star } from "lucide-react";

const QUICK_CHIPS = [3.5, 4.0, 4.25, 4.5, 4.75, 5.0];

export default function QuarterStarRatingPicker({
  initialRating = 0,
  onRate,
}: {
  initialRating?: number;
  onRate?: (rating: number) => void;
}) {
  const [rating, setRating] = useState(initialRating);

  const handleSelect = (val: number) => {
    setRating(val);
    if (onRate) onRate(val);
  };

  return (
    <div className="flex flex-col gap-3 glass-card p-4 rounded-2xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          <span className="text-base font-extrabold text-white">
            {rating > 0 ? rating.toFixed(2) : "0.00"}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-semibold">
          Select Rating
        </span>
      </div>

      {/* Quick Chips Row */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {QUICK_CHIPS.map((chip) => {
          const isSelected = Math.abs(rating - chip) < 0.01;
          return (
            <button
              key={chip}
              type="button"
              onClick={() => handleSelect(chip)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                isSelected
                  ? "bg-amber-400 text-slate-950 border-amber-400 shadow-md scale-105"
                  : "bg-slate-900/80 text-slate-300 border-slate-700 hover:border-amber-400/50 hover:bg-slate-800"
              }`}
            >
              {chip.toFixed(2)}★
            </button>
          );
        })}
      </div>

      {/* Range Slider for Fine Adjustment */}
      <div className="flex items-center gap-3 pt-1">
        <input
          type="range"
          min="0.25"
          max="5.0"
          step="0.25"
          value={rating}
          onChange={(e) => handleSelect(parseFloat(e.target.value))}
          className="w-full accent-amber-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
}
