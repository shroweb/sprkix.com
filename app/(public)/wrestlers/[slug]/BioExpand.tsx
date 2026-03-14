"use client";

import { useState } from "react";

const LIMIT = 280; // characters before truncation

export default function BioExpand({ bio }: { bio: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = bio.length > LIMIT;
  const visible = !isLong || expanded ? bio : bio.slice(0, LIMIT).trimEnd() + "…";

  return (
    <div className="border-l-2 border-primary/30 pl-4 space-y-2 max-w-2xl">
      <p className="text-foreground/70 font-medium italic leading-relaxed">{visible}</p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="text-[11px] font-black uppercase tracking-widest text-primary hover:text-primary/70 transition-colors"
        >
          {expanded ? "Show less ↑" : "Read more ↓"}
        </button>
      )}
    </div>
  );
}
