// Scheduled engagement messages: pre-show reminders and the weekly digest.
// Called from cron routes (see workers/import-scheduler).
import { prisma } from "@lib/prisma";
import { sendPushToUser } from "@lib/push";
import {
  sendEventReminderEmail,
  sendWeeklyDigestEmail,
  type DigestEvent,
} from "@lib/mail";

const HOUR = 60 * 60 * 1000;
const REMINDER_WINDOW_HOURS = 30;
const MAX_RECIPIENTS_PER_RUN = 500;
const DIGEST_MAX_RECIPIENTS = 2000;
const REMINDER_TYPE = "event_reminder";

/** Start of the current UTC day — events with only a date (no start time) count as "today". */
function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function sendEventReminders(now = new Date()) {
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_HOURS * HOUR);
  const events = await prisma.event.findMany({
    where: {
      OR: [
        { startTime: { gt: now, lte: windowEnd } },
        { startTime: null, date: { gte: startOfUtcDay(now), lte: windowEnd } },
      ],
    },
    select: {
      id: true, title: true, slug: true, promotion: true, date: true, startTime: true,
      enablePredictions: true,
    },
  });

  let notified = 0;
  let emailed = 0;

  for (const event of events) {
    if (notified >= MAX_RECIPIENTS_PER_RUN) break;
    const link = `/events/${event.slug}`;

    // Audience: people who saved this event, plus fans of the promotion.
    const [watchers, promoFans] = await Promise.all([
      prisma.watchListItem.findMany({
        where: { eventId: event.id, watchlist: true },
        select: { userId: true },
      }),
      prisma.user.findMany({
        where: { favoritePromotion: event.promotion, isSuspended: false },
        select: { id: true },
      }),
    ]);
    const candidateIds = [...new Set([...watchers.map((w) => w.userId), ...promoFans.map((u) => u.id)])];
    if (candidateIds.length === 0) continue;

    // Idempotency: one reminder per user per event, tracked via the notification itself.
    const already = await prisma.notification.findMany({
      where: { type: REMINDER_TYPE, link, userId: { in: candidateIds } },
      select: { userId: true },
    });
    const alreadySet = new Set(already.map((n) => n.userId));
    const recipients = await prisma.user.findMany({
      where: { id: { in: candidateIds.filter((id) => !alreadySet.has(id)) }, isSuspended: false },
      select: { id: true, name: true, email: true },
    });

    const startsAt = event.startTime ?? event.date;
    for (const user of recipients) {
      if (notified >= MAX_RECIPIENTS_PER_RUN) break;
      try {
        // Record first so a crash mid-send can't cause a duplicate on the next run.
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: REMINDER_TYPE,
            message: event.enablePredictions ? "Make your picks! 🎯" : "Starting soon 🔔",
            detail: event.title,
            link,
          },
        });
        notified++;
        await sendPushToUser(user.id, {
          title: event.enablePredictions ? "Make your picks! 🎯" : "Starting soon 🔔",
          body: event.title,
          data: { path: link },
        });
        const sent = await sendEventReminderEmail(user.email, user.name || "there", {
          title: event.title,
          slug: event.slug,
          startsAt,
          predictionsOpen: event.enablePredictions,
        });
        if (sent) emailed++;
      } catch (err) {
        console.error(`[reminders] Failed for user ${user.id} / event ${event.slug}:`, err);
      }
    }
  }

  return { events: events.length, notified, emailed };
}

export async function sendWeeklyDigest(now = new Date()) {
  const weekAgo = new Date(now.getTime() - 7 * 24 * HOUR);
  const weekAhead = new Date(now.getTime() + 7 * 24 * HOUR);

  const [upcomingRaw, recent] = await Promise.all([
    prisma.event.findMany({
      where: { date: { gte: startOfUtcDay(now), lte: weekAhead } },
      orderBy: { date: "asc" },
      take: 6,
      select: { title: true, slug: true, promotion: true, date: true, enablePredictions: true },
    }),
    prisma.event.findMany({
      where: { date: { gte: weekAgo, lt: now } },
      select: { id: true, title: true, slug: true, promotion: true, date: true },
    }),
  ]);

  const agg = recent.length
    ? await prisma.review.groupBy({
        by: ["eventId"],
        where: { eventId: { in: recent.map((e) => e.id) } },
        _avg: { rating: true },
        _count: { rating: true },
      })
    : [];
  const aggById = new Map(agg.map((a) => [a.eventId, a]));
  const topRated: DigestEvent[] = recent
    .map((e) => ({
      title: e.title,
      slug: e.slug,
      promotion: e.promotion,
      date: e.date,
      avgRating: aggById.get(e.id)?._avg.rating ?? 0,
      reviewCount: aggById.get(e.id)?._count.rating ?? 0,
    }))
    .filter((e) => e.reviewCount > 0)
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 5);
  const upcoming: DigestEvent[] = upcomingRaw.map((e) => ({
    title: e.title,
    slug: e.slug,
    promotion: e.promotion,
    date: e.date,
    predictionsOpen: e.enablePredictions,
  }));

  // Nothing worth sending — don't email an empty digest.
  if (upcoming.length === 0 && topRated.length === 0) {
    return { skipped: "nothing to report", sent: 0 };
  }

  const users = await prisma.user.findMany({
    where: { emailNotifications: true, isSuspended: false },
    select: { name: true, email: true },
    take: DIGEST_MAX_RECIPIENTS,
  });

  let sent = 0;
  for (const user of users) {
    try {
      if (await sendWeeklyDigestEmail(user.email, user.name || "there", { upcoming, topRated })) sent++;
    } catch (err) {
      console.error(`[digest] Failed for ${user.email}:`, err);
    }
  }
  return { recipients: users.length, sent };
}
