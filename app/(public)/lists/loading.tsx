export default function ListsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 space-y-8 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-10 w-36 bg-white/5 rounded-xl" />
        <div className="h-9 w-28 bg-white/5 rounded-xl" />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
            <div className="flex gap-2">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="w-12 aspect-[2/3] bg-white/5 rounded-lg" />
              ))}
            </div>
            <div className="h-4 bg-white/5 rounded w-3/4" />
            <div className="h-3 bg-white/5 rounded w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
