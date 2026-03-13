import Link from "next/link";
import { Star } from "lucide-react";
import Image from "next/image";

export default function RecentRatingsSidebar({
  reviews,
}: {
  reviews: any[];
}) {
  if (reviews.length === 0) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
        Recent Activity
      </h3>
      <div className="space-y-4">
        {reviews.slice(0, 5).map((review) => (
          <div key={review.id} className="group animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex gap-3">
              <Link href={`/users/${review.user.slug || review.user.id}`}>
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-white/10 shrink-0">
                  {review.user.avatarUrl ? (
                    <Image
                      src={review.user.avatarUrl}
                      alt={review.user.name || "User"}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-secondary flex items-center justify-center text-[10px] font-black uppercase">
                      {(review.user.name || "U")[0]}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Link 
                    href={`/users/${review.user.slug || review.user.id}`}
                    className="text-xs font-black uppercase tracking-tight truncate hover:text-primary transition-colors"
                  >
                    {review.user.name}
                  </Link>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Star className="w-2.5 h-2.5 text-primary fill-current" />
                    <span className="text-[10px] font-black italic">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-[11px] text-muted-foreground italic line-clamp-2 leading-relaxed">
                    "{review.comment}"
                  </p>
                )}
                <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest mt-1">
                    {new Date(review.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
