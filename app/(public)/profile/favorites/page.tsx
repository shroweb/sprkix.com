import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import { Heart, ChevronLeft, Calendar } from "lucide-react";
import { notFound } from "next/navigation";

export default async function FavoritesPage() {
  const user = await getUserFromServerCookie();
  if (!user) {
    return (
      <div className="text-center py-32">
        <p className="text-muted-foreground font-bold italic">
          You must be logged in to view your favorites.
        </p>
        <Link href="/login" className="btn-primary inline-block mt-6">
          Login
        </Link>
      </div>
    );
  }

  const favMatches = await prisma.favoriteMatch.findMany({
    where: { userId: user.id },
    include: {
      match: {
        include: {
          event: { select: { id: true, title: true, slug: true, date: true, promotion: true, posterUrl: true, type: true, createdAt: true } },
          participants: { include: { wrestler: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-20 relative z-10">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-8 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Profile
      </Link>

      <div className="space-y-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="h-[1px] w-8 bg-red-500"></div>
          <span className="text-xs font-black uppercase tracking-[0.2em] text-red-500 italic">
            Your Collection
          </span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tighter uppercase italic leading-[0.9]">
          Favorite Matches
        </h1>
        <p className="text-muted-foreground font-bold italic max-w-2xl">
          Everything you&apos;ve saved as top-tier wrestling. Totaling {favMatches.length} gems.
        </p>
      </div>

      {favMatches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {favMatches.map((fav) => (
            <Link
              key={fav.match.id}
              href={`/events/${fav.match.event.slug}`}
              className="bg-card/40 border border-white/5 rounded-2xl p-6 hover:bg-card/60 hover:border-red-500/20 transition-all group relative overflow-hidden flex flex-col justify-between h-full"
            >
              <div className="absolute top-0 right-0 p-4">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black text-muted-foreground bg-secondary px-2 py-0.5 rounded">
                    {fav.match.event.promotion}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-muted-foreground/60 italic">
                    <Calendar className="w-3 h-3" />
                    {new Date(fav.match.event.date).toLocaleDateString("en-US", { year: "numeric", month: "short" })}
                  </div>
                </div>
                <h3 className="font-black text-base md:text-lg uppercase italic tracking-tight group-hover:text-primary transition-colors leading-tight line-clamp-2 pr-8">
                  {fav.match.title}
                </h3>
                <div className="flex flex-wrap items-center gap-1.5 pt-2">
                  {(fav.match.participants as any[]).map((p: any, i: number) => (
                    <span key={`${p.wrestler.id}-${i}`} className="flex items-center gap-1.5">
                      {i > 0 && <span className="text-[10px] text-muted-foreground">&amp;</span>}
                      <span className="text-xs font-bold whitespace-nowrap">{p.wrestler.name}</span>
                    </span>
                  ))}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 group-hover:text-primary/40 transition-colors">
                <span>View Event Card</span>
                <span>→</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card/20 border border-dashed border-border rounded-[3rem] p-32 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/10 mx-auto mb-6" />
          <h2 className="text-2xl font-black italic uppercase text-muted-foreground/40 mb-2">The Hall is Empty</h2>
          <p className="text-muted-foreground font-bold italic">
            Go discover some absolute bangers and add them to your collection.
          </p>
          <Link href="/events" className="btn-primary inline-block mt-8">
            Explore Events
          </Link>
        </div>
      )}
    </div>
  );
}
