import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Eye, Bookmark, TrendingUp, Star, ChevronLeft } from "lucide-react";

export default async function WatchlistPage() {
  const user = await getUserFromServerCookie();
  if (!user) {
    redirect("/login");
  }

  let watchListItems: any[] = [];
  try {
      watchListItems = await prisma.watchListItem.findMany({
        where: { 
            userId: user.id,
            watchlist: true,
        },
        include: {
          event: {
            include: {
              reviews: {
                where: { userId: user.id },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
  } catch (err) {
      console.error("Watchlist page error:", err);
  }

  return (
    <div className="max-w-7xl mx-auto px-6 space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="flex items-center gap-4">
        <Bookmark className="w-8 h-8 text-primary" />
        <h1 className="text-5xl font-black italic uppercase tracking-tighter">
          My Watchlist
        </h1>
      </div>

      {watchListItems.length === 0 ? (
        <div className="bg-card/40 border border-white/5 border-dashed rounded-[3rem] p-24 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-4 text-muted-foreground">
            Your Queue is Empty
          </h2>
          <p className="text-muted-foreground font-medium italic mb-8 max-w-md mx-auto">
            Build your backlog of legendary events to watch later. When you find
            an event you want to remember, hit the bookmark icon.
          </p>
          <Link href="/events" className="btn-primary inline-flex items-center">
            Explore Events
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {watchListItems.map((item) => (
            <div
              key={item.id}
              className="bg-card/40 border border-white/5 rounded-3xl overflow-hidden hover:border-primary/20 transition-all flex flex-col items-stretch h-full shadow-xl"
            >
              <div className="flex gap-4 p-6 relative">
                <Link
                  href={`/events/${item.event.slug}`}
                  className="w-24 aspect-[2/3] relative rounded-2xl overflow-hidden shadow-lg shrink-0 border border-white/5 hover:scale-105 transition-transform duration-300"
                >
                  <Image
                    src={item.event.posterUrl || "/placeholder.png"}
                    alt={item.event.title}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="flex-1 flex flex-col min-w-0 pt-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded w-fit mb-2">
                    {item.event.promotion}
                  </span>
                  <Link
                    href={`/events/${item.event.slug}`}
                    className="font-black uppercase italic tracking-tight text-lg leading-tight hover:text-primary transition-colors flex-1"
                  >
                    {item.event.title.replace(/–\s*\d{4}.*$/, "").trim()}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-3">
                    <Calendar className="w-3 h-3 text-primary/70" />
                    {new Date(item.event.date).getFullYear()}
                  </div>
                </div>
              </div>

              <div className="bg-black/50 p-4 border-t border-white/5 mt-auto">
                {item.event.reviews.length > 0 ? (
                  <div className="flex items-center justify-between text-sm px-2">
                    <div className="flex items-center gap-2 font-black italic text-muted-foreground">
                      <Eye className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Watched</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-primary fill-current" />
                      <span className="font-black">
                        {item.event.reviews[0].rating}/5
                      </span>
                    </div>
                  </div>
                ) : (
                  <Link
                    href={`/events/${item.event.slug}`}
                    className="btn-secondary w-full py-2.5 text-xs font-black uppercase tracking-widest bg-white/5 border-none hover:bg-primary hover:text-black transition-colors"
                  >
                    Log Review
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
