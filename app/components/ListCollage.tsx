"use client";

import Image from "next/image";

export default function ListCollage({
  posters = [],
  title,
}: {
  posters: (string | null)[];
  title: string;
}) {
  const validPosters = posters.filter(Boolean).slice(0, 4);

  if (validPosters.length === 0) {
    return (
      <div className="w-full aspect-square bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-600 font-bold text-xs uppercase tracking-wider">
        No Posters
      </div>
    );
  }

  if (validPosters.length < 4) {
    return (
      <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800">
        <Image
          src={validPosters[0]!}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-slate-950/20" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 grid-rows-2 aspect-square w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
      {validPosters.map((poster, i) => (
        <div key={i} className="relative w-full h-full overflow-hidden border-r border-b border-slate-900/50">
          <Image
            src={poster!}
            alt={`${title} - poster ${i + 1}`}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
        </div>
      ))}
    </div>
  );
}
