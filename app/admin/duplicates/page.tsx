import { prisma } from "@lib/prisma";
import Link from "next/link";
import { AlertTriangle, CheckCircle } from "lucide-react";

function similarity(a: string, b: string): number {
  a = a.toLowerCase().replace(/[^a-z0-9]/g, "");
  b = b.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (a === b) return 1;
  if (a.includes(b) || b.includes(a)) return 0.9;
  // Simple bigram similarity
  const bigrams = (s: string) => Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2));
  const ab = new Set(bigrams(a));
  const bb = new Set(bigrams(b));
  const intersection = [...ab].filter(x => bb.has(x)).length;
  return (2 * intersection) / (ab.size + bb.size + 0.001);
}

export default async function DuplicatesPage() {
  const wrestlers = await prisma.wrestler.findMany({
    select: { id: true, name: true, slug: true, imageUrl: true, _count: { select: { matches: true } } },
    orderBy: { name: "asc" },
  });

  // Find pairs with similarity > 0.75
  type Pair = { a: typeof wrestlers[0]; b: typeof wrestlers[0]; score: number };
  const pairs: Pair[] = [];
  for (let i = 0; i < wrestlers.length; i++) {
    for (let j = i + 1; j < wrestlers.length; j++) {
      const score = similarity(wrestlers[i].name, wrestlers[j].name);
      if (score >= 0.75) {
        pairs.push({ a: wrestlers[i], b: wrestlers[j], score });
      }
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Wrestler Duplicate Finder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {pairs.length} potential duplicate pairs found across {wrestlers.length} wrestlers
        </p>
      </div>

      {pairs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-16 text-center space-y-3">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <p className="font-bold italic text-muted-foreground">No duplicates detected!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pairs.map(({ a, b, score }) => (
            <div key={`${a.id}-${b.id}`} className="bg-white rounded-2xl border border-border p-5 flex items-center gap-6">
              <div className={`shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase ${score >= 0.95 ? "bg-red-100 text-red-600" : score >= 0.85 ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"}`}>
                {Math.round(score * 100)}% match
              </div>

              {[a, b].map((w, i) => (
                <div key={w.id} className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{w.name}</p>
                  <p className="text-[10px] text-muted-foreground">{w._count.matches} matches</p>
                  <div className="flex gap-2 mt-2">
                    <Link href={`/wrestlers/${w.slug}`} className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                      View
                    </Link>
                    <Link href={`/admin/wrestlers/${w.id}/edit`} className="text-[10px] font-black text-muted-foreground hover:text-foreground hover:underline uppercase tracking-widest">
                      Edit
                    </Link>
                  </div>
                </div>
              ))}

              <div className="shrink-0 flex items-center gap-1 text-amber-500">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
