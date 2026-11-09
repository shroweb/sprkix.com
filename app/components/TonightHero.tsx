import Link from "next/link";
import { prisma } from "@lib/prisma";
import { Radio, Target, ArrowRight } from "lucide-react";
import Countdown from "./Countdown";
import FaceOff from "./FaceOff";
import { groupSides, inferTeams } from "@lib/match-sides";

const HOUR = 3_600_000;
const currentTime = () => Date.now();

/**
 * "Tonight" strip: shows when a show is live now or starts within 36 hours.
 * Renders nothing otherwise, so it never takes up space on quiet days.
 */
export default async function TonightHero() {
  const now = currentTime();
  let event;
  try {
    event = await prisma.event.findFirst({
      where: {
        startTime: { not: null, gte: new Date(now - 4 * HOUR), lte: new Date(now + 36 * HOUR) },
      },
      orderBy: { startTime: "asc" },
      select: {
        id: true,
        title: true,
        slug: true,
        promotion: true,
        startTime: true,
        endTime: true,
        enablePredictions: true,
        matches: {
          orderBy: { order: "desc" },
          take: 1,
          select: {
            id: true,
            title: true,
            type: true,
            participants: {
              select: { team: true, isWinner: true, wrestler: { select: { id: true, name: true, slug: true, imageUrl: true } } },
            },
            predictions: { select: { predictedWinnerId: true } },
          },
        },
      },
    });
  } catch {
    return null;
  }
  if (!event?.startTime) return null;

  const start = event.startTime.getTime();
  const end = event.endTime ? event.endTime.getTime() : start + 4 * HOUR;
  const live = now >= start && now <= end;
  if (!live && now > end) return null;

  const main = event.matches[0];
  const sides = main && main.participants.length >= 2 ? groupSides(inferTeams(main.participants, main.type, main.title)) : [];

  // Community split for the main event (by side)
  let split: number[] = [];
  if (main && sides.length >= 2) {
    const picks = main.predictions.map((p) => p.predictedWinnerId).filter(Boolean) as string[];
    const counts = sides.map((s) => picks.filter((id) => s.members.some((m) => m.wrestler.id === id)).length);
    const total = counts.reduce((a, b) => a + b, 0);
    split = total ? counts.map((c) => Math.round((c / total) * 100)) : [];
  }

  return (
    <section aria-label="Tonight" className="relative -mt-4 overflow-hidden border border-rose-500/30 bg-gradient-to-br from-rose-950/60 via-slate-950 to-slate-950 p-5 sm:p-8">
      <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.25em] text-rose-300">
            <span className="pr-live-dot h-2 w-2 bg-rose-500" />
            {live ? "Live now" : "Tonight"}
            <span className="text-muted-foreground">· {event.promotion}</span>
          </p>
          <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter sm:text-5xl">{event.title}</h2>
          {main && <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Main event: {main.title}</p>}
          {!live && (
            <div className="max-w-sm">
              <Countdown targetDate={event.startTime} />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link href={`/events/${event.slug}${event.enablePredictions && !live ? "#predictions" : ""}`} className="inline-flex items-center gap-2 bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:opacity-90">
              {live ? <Radio className="h-4 w-4" /> : <Target className="h-4 w-4" />}
              {live ? "Join the watch party" : event.enablePredictions ? "Predict now" : "View event"}
            </Link>
            <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-2 border border-white/20 px-5 py-3 text-xs font-bold uppercase tracking-widest hover:border-white/50">
              Full card <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {sides.length >= 2 && (
          <div className="w-full max-w-md space-y-2 md:w-96">
            <FaceOff sides={sides} size="lg" />
            {split.length === sides.length && (
              <div>
                <div className="flex h-2 overflow-hidden bg-white/10">
                  <div className="bg-primary" style={{ width: `${split[0]}%` }} />
                  <div className="bg-sky-400" style={{ width: `${split[1] ?? 0}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-bold tabular-nums text-muted-foreground">
                  <span className="text-primary">{split[0]}%</span>
                  <span className="uppercase tracking-widest">Community picks</span>
                  <span className="text-sky-400">{split[1] ?? 0}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
