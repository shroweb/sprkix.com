/* One-off helper to end the two demo live events by setting endTime in the past. */

const path = require("node:path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const prisma = new PrismaClient();

  const slugs = [
    "sprkix-live-friday-fight-night-2026-03-13",
    "sprkix-live-midnight-mat-madness-2026-03-13",
  ];

  const now = new Date();
  const endedAt = new Date(now.getTime() - 60 * 1000);

  const events = await prisma.event.findMany({
    where: { slug: { in: slugs } },
    select: { id: true, slug: true, endTime: true },
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
        endTime: endedAt,
        currentMatchOrder: totalMatches > 0 ? totalMatches : 1,
      },
    });
  }

  const updated = await prisma.event.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true, startTime: true, endTime: true, currentMatchOrder: true },
  });

  console.log("Ended live demo events:");
  for (const e of updated) {
    console.log(
      `- ${e.slug} start=${e.startTime ? e.startTime.toISOString() : "-"} end=${e.endTime ? e.endTime.toISOString() : "-"} currentMatchOrder=${e.currentMatchOrder}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

