"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex-1 h-12 bg-secondary/50 hover:bg-secondary text-foreground rounded-xl font-bold flex items-center justify-center gap-2 transition-all border border-white/5 active:scale-95"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-sm font-black italic">Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-black italic">Share</span>
        </>
      )}
    </button>
  );
}
