"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, ChevronLeft, ChevronRight, UserCircle } from "lucide-react";

type Wrestler = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
};

export default function WrestlersGrid({
  wrestlers,
}: {
  wrestlers: Wrestler[];
}) {
  const [search, setSearch] = useState("");
  const WRESTLERS_PER_PAGE = 24;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredWrestlers = wrestlers
    .filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredWrestlers.length / WRESTLERS_PER_PAGE);
  const paginated = filteredWrestlers.slice(
    (currentPage - 1) * WRESTLERS_PER_PAGE,
    currentPage * WRESTLERS_PER_PAGE,
  );

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-20 space-y-8 sm:space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter">
            The Roster
          </h1>
          <p className="text-muted-foreground font-medium italic">
            Documenting every legend and rising star in the square circle.
          </p>
        </div>

        <div className="bg-card border border-border p-2 rounded-2xl flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search roster..."
              className="bg-transparent pl-10 pr-4 py-2 text-sm outline-none w-full sm:w-48 font-medium"
              value={search}
              onChange={(e) => {
                setCurrentPage(1);
                setSearch(e.target.value);
              }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
        {paginated.map((wrestler) => (
          <Link
            key={wrestler.id}
            href={`/wrestlers/${wrestler.slug}`}
            className="group relative"
          >
            <div className="relative aspect-square rounded-[2rem] overflow-hidden shadow-xl mb-4 border border-white/5 bg-secondary/30">
              {wrestler.imageUrl ? (
                <Image
                  src={wrestler.imageUrl}
                  alt={wrestler.name}
                  fill
                  className="object-cover group-hover:scale-110 grayscale group-hover:grayscale-0 transition-all duration-700"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <UserCircle className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            <h2 className="font-black text-sm text-center uppercase italic tracking-tight group-hover:text-primary transition-colors">
              {wrestler.name}
            </h2>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-16 pt-8 border-t border-border">
          <button
            className="p-2 rounded-full border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            disabled={currentPage === 1}
            onClick={() => {
              setCurrentPage((p) => Math.max(1, p - 1));
              window.scrollTo(0, 0);
            }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-black italic uppercase tracking-widest text-muted-foreground">
            ROSTER PAGE {currentPage} / {totalPages}
          </span>
          <button
            className="p-2 rounded-full border border-border hover:bg-secondary disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
            disabled={currentPage === totalPages}
            onClick={() => {
              setCurrentPage((p) => Math.min(totalPages, p + 1));
              window.scrollTo(0, 0);
            }}
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </main>
  );
}
