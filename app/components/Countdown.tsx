"use client";

import { useEffect, useState } from "react";

function parts(distance: number) {
  return {
    days: Math.floor(distance / 86_400_000),
    hours: Math.floor((distance % 86_400_000) / 3_600_000),
    minutes: Math.floor((distance % 3_600_000) / 60_000),
    seconds: Math.floor((distance % 60_000) / 1000),
  };
}

export default function Countdown({ targetDate }: { targetDate: string | Date }) {
  // null until mounted so server and client markup match (no flash of zeros).
  const [left, setLeft] = useState<ReturnType<typeof parts> | "started" | null>(null);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const distance = target - Date.now();
      setLeft(distance <= 0 ? "started" : parts(distance));
      return distance <= 0;
    };
    if (tick()) return;
    const id = setInterval(() => {
      if (tick()) clearInterval(id);
    }, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (left === "started") {
    return (
      <p className="border border-primary/30 bg-primary/10 px-3 py-3 text-center text-xs font-black uppercase tracking-widest text-primary">
        Showtime
      </p>
    );
  }

  const cells: [string, number | null][] = [
    ["Days", left?.days ?? null],
    ["Hrs", left?.hours ?? null],
    ["Mins", left?.minutes ?? null],
    ["Secs", left?.seconds ?? null],
  ];
  return (
    <div className="grid grid-cols-4 gap-2" role="timer" aria-label="Time until the event starts">
      {cells.map(([label, value]) => (
        <div key={label} className="border border-white/[0.07] bg-white/[0.03] py-2.5 text-center">
          <div className="text-xl font-black italic tabular-nums leading-none">
            {value === null ? "--" : label === "Days" ? value : String(value).padStart(2, "0")}
          </div>
          <div className="mt-1.5 text-[8px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
        </div>
      ))}
    </div>
  );
}
