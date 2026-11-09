"use client";

import { useMemo } from "react";

/** Small deterministic PRNG: keeps render pure, and every burst still looks scattered. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = ["#facc15", "#34d399", "#60a5fa", "#f472b6", "#fb923c", "#a78bfa"];

/** CSS-only confetti burst. Renders once, fades out, and ignores pointer events. */
export default function Confetti({ pieces = 36 }: { pieces?: number }) {
  const items = useMemo(() => {
    const r = rng(pieces * 7919);
    return Array.from({ length: pieces }, (_, i) => ({
      left: r() * 100,
      delay: r() * 0.4,
      dur: 1.4 + r() * 1.2,
      drift: (r() - 0.5) * 160,
      rot: r() * 720 - 360,
      color: COLORS[i % COLORS.length],
      w: 6 + r() * 6,
    }));
  }, [pieces]);
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[90] overflow-hidden motion-reduce:hidden">
      {items.map((p, i) => (
        <span
          key={i}
          className="pr-confetti absolute top-0"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.w * 0.45,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            // @ts-expect-error custom props
            "--drift": `${p.drift}px`,
            "--rot": `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  );
}
