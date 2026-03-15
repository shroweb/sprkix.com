import { prisma } from "@lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getUserFromServerCookie } from "@lib/server-auth";
import { ChevronLeft, Star, Calendar, Lock, Globe } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserFromServerCookie();

  const list = await prisma.list.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, slug: true } },
      items: {
        include: {
          event: {
            include: { reviews: { select: { rating: true } } },
          },
          match: {
            include: {
              participants: { include: { wrestler: { select: { name: true } } } },
              event: { select: { id: true, title: true, slug: true, promotion: true, date: true, posterUrl: true } },
            },
          },
        },
        orderBy: { order: "asc" },
      },
    },
  });

  if (!list) return notFound();
  if (!list.isPublic && list.userId !== user?.id) return notFound();

  const isOwner = user?.id === list.userId;
  const isMatchList = list.listType === "matches";

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-10">
      {/* Header */}
      <div className="space-y-4">
        <Link
          href={`/users/${list.user.slug || list.user.id}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          {list.user.name}'s Profile
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {list.isPublic ? (
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                {list.isPublic ? "Public" : "Private"} List by {list.user.name}
              </span>
            </div>
            <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
              {list.title}
            </h1>
            {list.description && (
              <p className="text-muted-foreground font-medium italic max-w-2xl">
                {list.description}
              </p>
            )}
            <p className="text-xs font-bold text-muted-foreground">
              {list.items.length} {isMatchList ? "matches" : "events"}
            </p>
          </div>
          {isOwner && (
            <Link
              href={`/lists/${id}/edit`}
              className="btn-secondary text-xs px-4 py-2 shrink-0"
            >
              Edit List
            </Link>
          )}
        </div>
      </div>

      {/* Items */}
      {list.items.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
          <p className="text-muted-foreground font-bold italic">
            No {isMatchList ? "matches" : "events"} on this list yet.
          </p>
          {isOwner && (
            <p className="text-xs text-muted-foreground mt-2">
              Add {isMatchList ? "matches" : "events"} from any {isMatchList ? "event" : "event"} page using the "Add to List" button.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {list.items.map((item, idx) => {
            if (isMatchList && item.match) {
              const match = item.match;
              const participantNames = (match.participants || [])
                .map((p: any) => p.wrestler.name);
              // Group by team for vs display
              const teams: Record<number, string[]> = {};
              (match.participants || []).forEach((p: any) => {
                const t = p.team ?? 1;
                if (!teams[t]) teams[t] = [];
                teams[t].push(p.wrestler.name);
              });
              const teamEntries = Object.values(teams);
              const vsLabel = teamEntries.map((t) => t.join(" & ")).join(" vs ");

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-5 bg-card/40 border border-white/5 hover:border-primary/20 rounded-2xl p-4 transition-all"
                >
                  <span className="text-xl font-black text-muted-foreground/30 w-8 text-right shrink-0">
                    {idx + 1}
                  </span>
                  <div className="relative w-12 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                    <Image
                      src={match.event.posterUrl || "/placeholder.png"}
                      alt={match.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <Link
                      href={`/events/${match.event.slug}`}
                      className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors truncate block"
                    >
                      {match.title}
                    </Link>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                      <span className="text-primary/70 uppercase">
                        {match.event.promotion}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-2.5 h-2.5" />
                        {new Date(match.event.date).getFullYear()}
                      </span>
                    </div>
                    {vsLabel && (
                      <p className="text-[10px] text-muted-foreground font-medium truncate">
                        {vsLabel}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-xs text-muted-foreground italic mt-1">
                        "{item.note}"
                      </p>
                    )}
                  </div>
                </div>
              );
            }

            // Event item
            const event = item.event!;
            const ratings = event.reviews.map((r: any) => r.rating);
            const avg = ratings.length
              ? (ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(1)
              : null;

            return (
              <div
                key={item.id}
                className="group flex items-center gap-5 bg-card/40 border border-white/5 hover:border-primary/20 rounded-2xl p-4 transition-all"
              >
                <span className="text-xl font-black text-muted-foreground/30 w-8 text-right shrink-0">
                  {idx + 1}
                </span>
                <div className="relative w-12 aspect-[2/3] rounded-xl overflow-hidden shrink-0 border border-white/5">
                  <Image
                    src={event.posterUrl || "/placeholder.png"}
                    alt={event.title}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <Link
                    href={`/events/${event.slug}`}
                    className="font-black text-sm italic uppercase tracking-tight group-hover:text-primary transition-colors truncate block"
                  >
                    {event.title.replace(/–\s*\d{4}.*$/, "").trim()}
                  </Link>
                  <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
                    <span className="text-primary/70 uppercase">
                      {(event as any).promotion}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date((event as any).date).getFullYear()}
                    </span>
                    {avg && (
                      <span className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-primary fill-current" />
                        {avg}
                      </span>
                    )}
                  </div>
                  {item.note && (
                    <p className="text-xs text-muted-foreground italic mt-1">
                      "{item.note}"
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
