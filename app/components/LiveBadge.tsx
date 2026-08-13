"use client";

export default function LiveBadge({ label = "LIVE NOW" }: { label?: string }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-800/80 text-rose-300 text-xs font-bold uppercase tracking-wider shadow-sm backdrop-blur-md">
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
      </span>
      <span>{label}</span>
    </div>
  );
}
