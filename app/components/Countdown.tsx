"use client";

import { useState, useEffect } from "react";

export default function Countdown({ targetDate }: { targetDate: string | Date }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const target = new Date(targetDate).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = target - now;

      if (distance < 0) {
        clearInterval(interval);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-secondary/40 p-2 rounded-xl text-center">
        <div className="text-xl font-black italic tabular-nums">{timeLeft.days}</div>
        <div className="text-[8px] font-bold text-muted-foreground uppercase">Days</div>
      </div>
      <div className="bg-secondary/40 p-2 rounded-xl text-center">
        <div className="text-xl font-black italic tabular-nums">{timeLeft.hours}</div>
        <div className="text-[8px] font-bold text-muted-foreground uppercase">Hrs</div>
      </div>
      <div className="bg-secondary/40 p-2 rounded-xl text-center">
        <div className="text-xl font-black italic tabular-nums">{timeLeft.minutes}</div>
        <div className="text-[8px] font-bold text-muted-foreground uppercase">Mins</div>
      </div>
    </div>
  );
}
