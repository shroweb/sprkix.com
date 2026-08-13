"use client";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl bg-slate-800/60 ${className}`}
    />
  );
}

export function EventCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden p-4 flex flex-col gap-3 animate-pulse">
      <SkeletonBox className="w-full aspect-[16/9] rounded-lg" />
      <div className="flex justify-between items-center mt-1">
        <SkeletonBox className="h-4 w-24" />
        <SkeletonBox className="h-4 w-12" />
      </div>
      <SkeletonBox className="h-6 w-3/4" />
      <SkeletonBox className="h-4 w-1/2" />
    </div>
  );
}

export function MatchCardSkeleton() {
  return (
    <div className="glass-card p-4 flex flex-col gap-3 animate-pulse">
      <div className="flex justify-between items-center">
        <SkeletonBox className="h-4 w-16" />
        <SkeletonBox className="h-4 w-20" />
      </div>
      <SkeletonBox className="h-6 w-2/3" />
      <SkeletonBox className="h-4 w-1/3" />
    </div>
  );
}

export function GridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
