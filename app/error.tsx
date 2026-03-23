"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center">
      <div className="space-y-6 max-w-md">
        <div className="space-y-2">
          <p className="text-8xl font-black italic uppercase tracking-tight text-primary">500</p>
          <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tight">
            Something went wrong
          </h1>
          <p className="text-muted-foreground font-medium">
            An unexpected error occurred. Try refreshing the page or head back home.
          </p>
          {error.digest && (
            <p className="text-xs text-muted-foreground font-mono">Error: {error.digest}</p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-black uppercase italic text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-card/40 border border-white/10 text-foreground font-black uppercase italic text-sm px-6 py-3 rounded-xl hover:border-primary/30 hover:bg-card/60 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
