/** Server-safe skeleton blocks for route-level loading.tsx files. */
export function Bone({ className = "" }: { className?: string }) {
  return <div className={`pr-skeleton ${className}`} aria-hidden />;
}

export default function PageSkeleton({ variant = "detail" }: { variant?: "detail" | "grid" | "profile" }) {
  return (
    <div className="space-y-8" role="status" aria-label="Loading">
      {variant === "profile" ? (
        <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
          <Bone className="aspect-[2/3] w-44 md:w-56" />
          <div className="w-full flex-1 space-y-4">
            <Bone className="h-3 w-32" />
            <Bone className="h-12 w-3/4" />
            <div className="flex gap-3">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-20 w-24" />)}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Bone className="h-3 w-32" />
          <Bone className="h-12 w-2/3" />
          <Bone className="h-4 w-1/2" />
        </div>
      )}
      <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-9 w-24" />)}</div>
      {variant === "grid" ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{Array.from({ length: 8 }, (_, i) => <Bone key={i} className="aspect-[2/3]" />)}</div>
      ) : (
        <div className="space-y-3">{[0, 1, 2, 3].map((i) => <Bone key={i} className="h-24 w-full" />)}</div>
      )}
      <span className="sr-only">Loading…</span>
    </div>
  );
}
