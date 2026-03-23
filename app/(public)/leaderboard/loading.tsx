export default function LeaderboardLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-12 w-56 bg-white/5 rounded-xl" />
        <div className="h-4 w-80 bg-white/5 rounded" />
      </div>

      {/* Top 3 podium */}
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-3 p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="w-16 h-16 bg-white/5 rounded-full" />
            <div className="h-4 w-24 bg-white/5 rounded" />
            <div className="h-6 w-12 bg-white/5 rounded" />
          </div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-xl">
            <div className="h-6 w-6 bg-white/5 rounded shrink-0" />
            <div className="w-10 h-10 bg-white/5 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 bg-white/5 rounded w-32" />
              <div className="h-3 bg-white/5 rounded w-20" />
            </div>
            <div className="h-6 w-14 bg-white/5 rounded-lg shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
