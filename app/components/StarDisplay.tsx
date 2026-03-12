import { Star, StarHalf } from "lucide-react";

export default function StarDisplay({ rating, showNumber = false }: { rating: number; showNumber?: boolean }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.25 && rating % 1 < 0.75;
  const roundedFullStars = rating % 1 >= 0.75 ? fullStars + 1 : fullStars;
  const finalHasHalf = rating % 1 >= 0.25 && rating % 1 < 0.75;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => {
          const starValue = i + 1;
          if (starValue <= fullStars || (starValue === fullStars + 1 && rating % 1 >= 0.75)) {
            return <Star key={i} className="w-4 h-4 text-primary fill-current" />;
          } else if (starValue === fullStars + 1 && rating % 1 >= 0.25) {
            return (
              <div key={i} className="relative w-4 h-4">
                <Star className="absolute inset-0 w-4 h-4 text-muted-foreground/30" />
                <div className="absolute inset-0 w-[50%] overflow-hidden">
                  <Star className="w-4 h-4 text-primary fill-current" />
                </div>
              </div>
            );
          } else {
            return <Star key={i} className="w-4 h-4 text-muted-foreground/30" />;
          }
        })}
      </div>
      {showNumber && (
        <span className="text-xs font-black italic tracking-tighter text-primary">
          {rating.toFixed(2)}
        </span>
      )}
    </div>
  );
}
