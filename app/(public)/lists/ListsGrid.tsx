"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Globe, Lock, List } from "lucide-react";

type ListItem = {
  event?: { posterUrl: string | null; title: string } | null;
  match?: { title: string; event: { posterUrl: string | null; title: string } } | null;
};

type PublicList = {
  id: string;
  title: string;
  listType: string;
  createdAt: string | Date;
  items: ListItem[];
  _count: { items: number };
  user: {
    id: string;
    name: string | null;
    slug: string;
    avatarUrl: string | null;
  };
};

type Props = {
  publicLists: PublicList[];
  isLoggedIn: boolean;
  userHasMyLists: boolean;
};

type TypeFilter = "all" | "events" | "matches";
type SortOption = "newest" | "most-items" | "az";

export default function ListsGrid({ publicLists, isLoggedIn, userHasMyLists }: Props) {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");

  const filtered = useMemo(() => {
    let result = [...publicLists];

    if (typeFilter !== "all") {
      result = result.filter((l) => l.listType === typeFilter);
    }

    if (sort === "newest") {
      result.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "most-items") {
      result.sort((a, b) => b._count.items - a._count.items);
    } else if (sort === "az") {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [publicLists, typeFilter, sort]);

  const typeFilters: { value: TypeFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "events", label: "Events" },
    { value: "matches", label: "Matches" },
  ];

  return (
    <section className="space-y-6">
      {userHasMyLists && (
        <div className="flex items-center gap-6">
          <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-foreground">
              Public Lists
            </h2>
          </div>
          <div className="flex-1 h-[1px] bg-gradient-to-r from-white/10 to-transparent" />
        </div>
      )}

      {/* Filters row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type pill filters */}
        <div className="flex items-center gap-2">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all border ${
                typeFilter === f.value
                  ? "bg-primary text-black border-primary"
                  : "bg-transparent border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-xs font-black uppercase tracking-wider text-foreground focus:outline-none focus:border-primary/30 cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="most-items">Most Items</option>
          <option value="az">A–Z</option>
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-[2rem] p-20 text-center">
          <List className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground font-bold italic">
            {publicLists.length === 0
              ? "No public lists yet. Be the first!"
              : "No lists match your filter."}
          </p>
          {publicLists.length === 0 && (
            isLoggedIn ? (
              <Link href="/lists/create" className="btn-primary inline-block mt-4 text-sm">
                Create a List
              </Link>
            ) : (
              <Link href="/login" className="btn-primary inline-block mt-4 text-sm">
                Sign in to create
              </Link>
            )
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((list) => (
            <Link
              key={list.id}
              href={`/lists/${list.id}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 transition-all"
            >
              {/* Poster strip */}
              <div className="relative flex h-28 overflow-hidden">
                {list.items.length > 0 ? (
                  list.items.map((item, i) => {
                    const posterUrl =
                      item.event?.posterUrl ||
                      item.match?.event?.posterUrl ||
                      "/placeholder.svg";
                    const altText = item.event?.title || item.match?.title || "";
                    return (
                      <div
                        key={i}
                        className="relative flex-1 overflow-hidden"
                        style={{
                          flexBasis: `${100 / Math.min(list.items.length, 3)}%`,
                        }}
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

              {/* Card body */}
              <div className="p-4 space-y-3">
                <h3 className="font-black italic uppercase tracking-tight text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {list.title}
                </h3>

                {/* Owner */}
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-primary/20 overflow-hidden shrink-0 flex items-center justify-center">
                    {list.user.avatarUrl ? (
                      <Image
                        src={list.user.avatarUrl}
                        alt={list.user.name || ""}
                        width={20}
                        height={20}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-[8px] font-black text-primary">
                        {list.user.name?.charAt(0).toUpperCase() ?? "U"}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground truncate">
                    {list.user.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">
                    {list._count.items}{" "}
                    {list.listType === "matches" ? "matches" : "events"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
