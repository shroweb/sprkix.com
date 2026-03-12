import { prisma } from "@lib/prisma";
import Link from "next/link";
import { Star, Trash2, ExternalLink } from "lucide-react";
import DeleteReviewButton from "./DeleteReviewButton";

export default async function ReviewBrowserPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page: pageStr, q } = await searchParams;
  const page = parseInt(pageStr ?? "1");
  const take = 30;
  const skip = (page - 1) * take;

  const where = q
    ? {
        OR: [
          { event: { title: { contains: q, mode: "insensitive" as const } } },
          { user: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      take,
      skip,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true } },
        event: { select: { title: true, slug: true } },
      },
    }),
    prisma.review.count({ where }),
  ]);

  const pages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Review Browser</h1>
        <p className="text-muted-foreground text-sm mt-1">{total.toLocaleString()} total reviews</p>
      </div>

      {/* Search */}
      <form className="flex gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by event or user…"
          className="flex-1 px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 bg-white"
        />
        <button type="submit" className="px-5 py-2.5 bg-primary text-black text-sm font-black rounded-xl">Search</button>
      </form>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="divide-y divide-border">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/events/${r.event.slug}`} className="text-sm font-bold hover:text-primary transition-colors truncate">
                    {r.event.title}
                  </Link>
                  <span className="text-[10px] text-muted-foreground">by <strong>{r.user.name ?? "Unknown"}</strong></span>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
                {r.comment && <p className="text-xs text-muted-foreground line-clamp-2">{r.comment}</p>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1 bg-yellow-50 border border-yellow-100 px-2.5 py-1 rounded-lg">
                  <Star className="w-3 h-3 text-yellow-500 fill-current" />
                  <span className="text-xs font-black">{r.rating}</span>
                </div>
                <DeleteReviewButton reviewId={r.id} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: Math.min(pages, 10) }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/reviews?page=${p}${q ? `&q=${q}` : ""}`}
              className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-black transition-colors ${p === page ? "bg-primary text-black" : "bg-white border border-border hover:bg-slate-50"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
