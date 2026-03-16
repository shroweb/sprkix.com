"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle } from "lucide-react";

const PAGE_SIZE = 8;

type Prediction = {
  id: string;
  isCorrect: boolean | null;
  predictedWinnerId: string | null;
  match: {
    event: { slug: string; promotion: string; date: string };
    participants: { isWinner: boolean; wrestler: { id: string; name: string } }[];
  };
};

export default function PredictionsList({ predictions }: { predictions: Prediction[] }) {
  const [visible, setVisible] = useState(PAGE_SIZE);

  const shown = predictions.slice(0, visible);
  const hasMore = visible < predictions.length;

  return (
    <div className="space-y-3">
      {shown.map((pred) => {
        const winnerIds = new Set(
          pred.match.participants.filter((p) => p.isWinner).map((p) => p.wrestler.id),
        );
        const isCorrect =
          pred.isCorrect !== null
            ? pred.isCorrect
            : pred.predictedWinnerId
            ? winnerIds.has(pred.predictedWinnerId)
            : false;

        const names = pred.match.participants.map((p) => p.wrestler.name).join(" vs ");
        const predictedWrestler = pred.match.participants.find(
          (p) => p.wrestler.id === pred.predictedWinnerId,
        )?.wrestler;

        return (
          <Link
            key={pred.id}
            href={`/events/${pred.match.event.slug}`}
            className={`flex gap-5 items-center rounded-[2rem] p-5 border transition-all group ${
              isCorrect
                ? "bg-emerald-500/5 border-emerald-500/20 hover:border-emerald-500/40"
                : "bg-red-500/5 border-red-500/15 hover:border-red-500/30"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isCorrect ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"
              }`}
            >
              {isCorrect ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <span className="text-lg font-black">✗</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-widest text-white/30 mb-0.5">
                {pred.match.event.promotion} · {new Date(pred.match.event.date).getFullYear()}
              </p>
              <p className="text-sm font-black italic uppercase tracking-tight text-white/80 group-hover:text-white transition-colors truncate">
                {names}
              </p>
              {predictedWrestler && (
                <p className="text-[11px] font-bold text-muted-foreground mt-0.5">
                  Picked:{" "}
                  <span className={isCorrect ? "text-emerald-400" : "text-red-400"}>
                    {predictedWrestler.name}
                  </span>
                </p>
              )}
            </div>
            <div
              className={`text-[10px] font-black uppercase tracking-widest shrink-0 ${
                isCorrect ? "text-emerald-400" : "text-red-400/70"
              }`}
            >
              {isCorrect ? "Correct ✓" : "Wrong"}
            </div>
          </Link>
        );
      })}

      {hasMore && (
        <button
          onClick={() => setVisible((v) => v + PAGE_SIZE)}
          className="w-full py-3 rounded-2xl border border-white/10 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:border-white/20 transition-all"
        >
          Show more ({predictions.length - visible} remaining)
        </button>
      )}
    </div>
  );
}
