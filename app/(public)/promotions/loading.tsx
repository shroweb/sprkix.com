export default function PromotionsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 py-10 space-y-8 animate-pulse">
      <div className="h-10 w-48 bg-white/5 rounded-xl" />
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-square bg-white/5 rounded-2xl" />
            <div className="h-4 bg-white/5 rounded w-3/4 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}
