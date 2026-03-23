export default function RankingsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-3">
        <div className="h-12 w-64 bg-white/5 rounded-xl" />
        <div className="h-4 w-96 bg-white/5 rounded" />
      </div>

      {/* List */}
      <div className="space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="h-8 w-8 bg-white/5 rounded-lg shrink-0" />
            <div className="w-12 aspect-[2/3] bg-white/5 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-white/5 rounded w-1/2" />
              <div className="h-3 bg-white/5 rounded w-1/4" />
            </div>
            <div className="h-8 w-16 bg-white/5 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
