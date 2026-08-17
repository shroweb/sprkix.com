import { prisma } from "@lib/prisma";
import Link from "next/link";
import { CheckCircle, XCircle, ExternalLink, Newspaper } from "lucide-react";

export default async function AuditPage() {
  const [events, wrestlers, matchesMissingResult, drafts] = await Promise.all([
    prisma.event.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true, title: true, slug: true, date: true, promotion: true,
        posterUrl: true, description: true, venue: true,
        _count: { select: { matches: true, reviews: true } },
      },
    }),
    prisma.wrestler.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, imageUrl: true, bio: true },
    }),
    prisma.match.findMany({
      where: { result: null },
      orderBy: { event: { date: "desc" } },
      take: 50,
      select: {
        id: true, title: true,
        event: { select: { id: true, title: true, slug: true, date: true } },
      },
    }),
    prisma.newsPost.findMany({
      where: { status: "draft" },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, title: true, slug: true, updatedAt: true },
    }),
  ]);

  const issues = events.map((e) => ({
    ...e,
    missingPoster: !e.posterUrl,
    missingDescription: !e.description,
    missingVenue: !e.venue,
    noMatches: e._count.matches === 0,
    score: [!e.posterUrl, !e.description, !e.venue, e._count.matches === 0].filter(Boolean).length,
  }));

  const withIssues = issues.filter((e) => e.score > 0).sort((a, b) => b.score - a.score);
  const perfect = issues.filter((e) => e.score === 0).length;

  const incompleteWrestlers = wrestlers
    .filter((w) => !w.imageUrl || !w.bio)
    .sort((a, b) => Number(!a.imageUrl) - Number(!b.imageUrl));

  const Check = ({ ok }: { ok: boolean }) =>
    ok ? (
      <CheckCircle className="w-4 h-4 text-emerald-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-400" />
    );

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Content Audit</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {withIssues.length} events need attention · {perfect} complete
          </p>
        </div>
        <div className="flex gap-3">
          {[
            { color: "bg-red-100 text-red-700", label: `${issues.filter(e => e.score >= 3).length} Critical` },
            { color: "bg-amber-100 text-amber-700", label: `${issues.filter(e => e.score === 2).length} Warning` },
            { color: "bg-blue-100 text-blue-700", label: `${issues.filter(e => e.score === 1).length} Minor` },
          ].map(b => (
            <span key={b.label} className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg ${b.color}`}>{b.label}</span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Event</span>
          <span className="w-16 text-center">Poster</span>
          <span className="w-16 text-center">Desc</span>
          <span className="w-16 text-center">Venue</span>
          <span className="w-16 text-center">Matches</span>
          <span className="w-16 text-center">Edit</span>
        </div>
        <div className="divide-y divide-border max-h-[60vh] overflow-y-auto">
          {withIssues.map((e) => (
            <div key={e.id} className={`grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 items-center px-6 py-3 hover:bg-slate-50 transition-colors ${e.score >= 3 ? "border-l-2 border-red-300" : e.score === 2 ? "border-l-2 border-amber-300" : ""}`}>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{e.title}</p>
                <p className="text-[10px] text-muted-foreground">{e.promotion} · {new Date(e.date).toLocaleDateString()}</p>
              </div>
              <div className="w-16 flex justify-center"><Check ok={!e.missingPoster} /></div>
              <div className="w-16 flex justify-center"><Check ok={!e.missingDescription} /></div>
              <div className="w-16 flex justify-center"><Check ok={!e.missingVenue} /></div>
              <div className="w-16 flex justify-center"><Check ok={!e.noMatches} /></div>
              <div className="w-16 flex justify-center">
                <Link href={`/admin/events/${e.id}/edit`} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {withIssues.length === 0 && (
            <div className="py-16 text-center">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <p className="font-bold italic text-muted-foreground">All events are complete!</p>
            </div>
          )}
        </div>
      </div>

      {/* Wrestler completeness */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg">Wrestler Completeness</h2>
          <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            {incompleteWrestlers.length} missing image/bio
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 bg-slate-50 border-b border-border text-[10px] font-black uppercase tracking-widest text-muted-foreground">
          <span>Wrestler</span>
          <span className="w-16 text-center">Image</span>
          <span className="w-16 text-center">Bio</span>
          <span className="w-16 text-center">Edit</span>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {incompleteWrestlers.slice(0, 50).map((w) => (
            <div key={w.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 items-center px-6 py-3 hover:bg-slate-50">
              <p className="text-sm font-bold truncate">{w.name}</p>
              <div className="w-16 flex justify-center"><Check ok={!!w.imageUrl} /></div>
              <div className="w-16 flex justify-center"><Check ok={!!w.bio} /></div>
              <div className="w-16 flex justify-center">
                <Link href={`/admin/wrestlers`} className="p-1.5 rounded-lg hover:bg-primary/10 hover:text-primary text-muted-foreground">
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
          {incompleteWrestlers.length === 0 && (
            <div className="py-10 text-center text-muted-foreground font-bold italic">All wrestlers complete.</div>
          )}
        </div>
      </div>

      {/* Matches missing results */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="font-bold text-lg">Matches Missing Results</h2>
        </div>
        <div className="divide-y divide-border max-h-96 overflow-y-auto">
          {matchesMissingResult.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground font-bold italic">No unresolved matches.</div>
          ) : (
            matchesMissingResult.map((m) => (
              <div key={m.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{m.title || "(untitled)"}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{m.event.title}</p>
                </div>
                <Link href={`/admin/events/${m.event.id}/edit`} className="text-xs font-bold text-primary hover:underline shrink-0">
                  Resolve →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      {/* News drafts */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-primary" />
          <h2 className="font-bold text-lg">News Drafts</h2>
        </div>
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {drafts.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground font-bold italic">No drafts.</div>
          ) : (
            drafts.map((d) => (
              <div key={d.id} className="flex items-center gap-4 px-6 py-3 hover:bg-slate-50">
                <p className="flex-1 min-w-0 text-sm font-bold truncate">{d.title}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(d.updatedAt).toLocaleDateString()}
                </span>
                <Link href={`/admin/news`} className="text-xs font-bold text-primary hover:underline shrink-0">
                  Edit →
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
