export default function EventsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="h-9 w-32 bg-white/5 rounded-xl" />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-white/5 rounded-full" />
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[2/3] bg-white/5 rounded-2xl" />
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
