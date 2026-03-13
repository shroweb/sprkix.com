/* One-off helper to end the two demo upcoming events by setting start/end times in the past. */

const path = require("node:path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  const slugs = [
    "sprkix-upcoming-spring-clash-2026",
    "sprkix-upcoming-rumble-night-2026",
  ];

  const now = new Date();
  const endedAt = new Date(now.getTime() - 60 * 1000);
  const startedAt = new Date(now.getTime() - 3 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true },
  });

  const bySlug = new Map(events.map((e) => [e.slug, e]));
  const missing = slugs.filter((s) => !bySlug.has(s));
  if (missing.length) throw new Error(`Missing events: ${missing.join(", ")}`);

  for (const slug of slugs) {
    const event = bySlug.get(slug);
    const totalMatches = await prisma.match.count({ where: { eventId: event.id } });

    await prisma.event.update({
      where: { id: event.id },
      data: {
        // Make it unambiguously "archive" per current UI logic:
        // isLive requires startTime and now <= endTime; isUpcoming checks now < startTime.
        startTime: startedAt,
        endTime: endedAt,
        date: startedAt,
        currentMatchOrder: totalMatches > 0 ? totalMatches : 1,
      },
    });
  }

  const updated = await prisma.event.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, date: true, startTime: true, endTime: true, currentMatchOrder: true },
  });

  console.log("Ended upcoming demo events:");
  for (const e of updated) {
    console.log(
      `- ${e.slug} date=${e.date.toISOString()} start=${e.startTime ? e.startTime.toISOString() : "-"} end=${e.endTime ? e.endTime.toISOString() : "-"} currentMatchOrder=${e.currentMatchOrder}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

