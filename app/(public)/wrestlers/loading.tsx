export default function WrestlersLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="h-10 w-48 bg-white/5 rounded-xl" />
        <div className="h-9 w-64 bg-white/5 rounded-xl" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[...Array(24)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square bg-white/5 rounded-2xl" />
            <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
            <div className="h-3 bg-white/5 rounded w-1/2 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
