import { prisma } from "@lib/prisma";
import { getUserFromServerCookie } from "@lib/server-auth";
import Link from "next/link";
import Image from "next/image";
import { Globe, Lock, Plus, List } from "lucide-react";
import ListsGrid from "./ListsGrid";

export const dynamic = "force-dynamic";

export default async function ListsDiscoveryPage() {
  const user = await getUserFromServerCookie();

  const [publicLists, myLists] = await Promise.all([
    prisma.list.findMany({
      where: { isPublic: true },
      include: {
        user: { select: { id: true, name: true, slug: true, avatarUrl: true } },
        items: {
          include: {
            event: { select: { posterUrl: true, title: true } },
            match: { select: { title: true, event: { select: { posterUrl: true, title: true } } } },
          },
          orderBy: { order: "asc" },
          take: 3,
        },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    user
      ? prisma.list.findMany({
          where: { userId: user.id },
          include: {
            items: {
              include: {
                event: { select: { posterUrl: true, title: true } },
                match: { select: { title: true, event: { select: { posterUrl: true, title: true } } } },
              },
              orderBy: { order: "asc" },
              take: 3,
            },
            _count: { select: { items: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-16">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4 pt-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
            Community Lists
          </h1>
          <p className="text-muted-foreground font-medium">
            Curated event collections from the community
          </p>
        </div>
        {user && (
          <Link
            href="/lists/create"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-black font-black uppercase tracking-widest text-xs rounded-2xl hover:opacity-90 transition-opacity shrink-0"
          >
            <Plus className="w-4 h-4" /> Create a List
          </Link>
        )}
      </div>

      {/* My Lists section */}
      {user && myLists.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-primary">
                My Lists
              </h2>
            </div>
            <div className="flex-1 h-[1px] bg-gradient-to-r from-primary/20 to-transparent" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {myLists.map((list: any) => (
              <div
                key={list.id}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all group"
              >
                {/* Poster strip */}
                <Link href={`/lists/${list.id}`} className="block">
                  <div className="relative flex h-28 overflow-hidden">
                    {list.items.length > 0 ? (
                      list.items.map((item: any, i: number) => {
                        const posterUrl = item.event?.posterUrl || item.match?.event?.posterUrl || "/placeholder.png";
                        const altText = item.event?.title || item.match?.title || "";
                        return (
                          <div
                            key={i}
                            className="relative flex-1 overflow-hidden"
                            style={{ flexBasis: `${100 / Math.min(list.items.length, 3)}%` }}
                          >
                            <Image
                              src={posterUrl}
                              alt={altText}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex-1 bg-secondary flex items-center justify-center">
                        <List className="w-8 h-8 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
                  </div>
                </Link>

                {/* Card body */}
                <div className="p-4 flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <Link
                      href={`/lists/${list.id}`}
                      className="font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight block"
                    >
                      {list.title}
                    </Link>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      {list.isPublic ? (
                        <>
                          <Globe className="w-3 h-3" />
                          <span>Public</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>Private</span>
                        </>
                      )}
                      <span className="mx-1">·</span>
                      <span>{list._count.items} {list.listType === "matches" ? "matches" : "events"}</span>
                    </div>
                  </div>
                  <Link
                    href={`/lists/${list.id}/edit`}
                    className="shrink-0 px-3 py-1.5 bg-secondary border border-border rounded-xl text-[10px] font-black uppercase tracking-wider hover:border-primary/30 hover:text-primary transition-all"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Public lists with filters */}
      <ListsGrid
        publicLists={publicLists as any}
        isLoggedIn={!!user}
        userHasMyLists={!!(user && myLists.length > 0)}
      />

      {!user && (
        <div className="text-center py-6">
          <p className="text-muted-foreground font-medium text-sm">
            <Link href="/login" className="text-primary font-black hover:underline">
              Sign in
            </Link>{" "}
            to create and manage your own lists.
          </p>
        </div>
      )}
    </div>
  );
}
