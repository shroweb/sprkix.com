/* One-off helper to add demo events into the local DB.
   Uses .env.local first (Next dev), then falls back to .env. */

const path = require("node:path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function utcIso(year, month, day, hh, mm) {
  // month: 1-12
  return new Date(Date.UTC(year, month - 1, day, hh, mm, 0));
}

async function main() {
  const prisma = new PrismaClient();

  const events = [
    // Upcoming (any future dates)
    {
      slug: "sprkix-upcoming-spring-clash-2026",
      title: "Spring Clash",
      promotion: "SPRKIX",
      date: utcIso(2026, 3, 20, 19, 0),
      venue: "London, UK",
      type: "PPV",
      description: "Demo upcoming event for local testing.",
    },
    {
      slug: "sprkix-upcoming-rumble-night-2026",
      title: "Rumble Night",
      promotion: "SPRKIX",
      date: utcIso(2026, 4, 5, 20, 0),
      venue: "Manchester, UK",
      type: "TV Special",
      description: "Demo upcoming event for local testing.",
    },

    // Live window requested: Friday 13/03/2026 16:30-23:30 GMT
    {
      slug: "sprkix-live-friday-fight-night-2026-03-13",
      title: "Friday Fight Night",
      promotion: "SPRKIX",
      date: utcIso(2026, 3, 13, 16, 30),
      venue: "Birmingham, UK",
      type: "Live",
      startTime: utcIso(2026, 3, 13, 16, 30),
      endTime: utcIso(2026, 3, 13, 23, 30),
      description: "Demo live event for local testing (16:30-23:30 GMT).",
    },
    {
      slug: "sprkix-live-midnight-mat-madness-2026-03-13",
      title: "Midnight Mat Madness",
      promotion: "SPRKIX",
      date: utcIso(2026, 3, 13, 16, 30),
      venue: "Glasgow, UK",
      type: "Live",
      startTime: utcIso(2026, 3, 13, 16, 30),
      endTime: utcIso(2026, 3, 13, 23, 30),
      description: "Demo live event for local testing (16:30-23:30 GMT).",
    },
  ];

  for (const e of events) {
    await prisma.event.upsert({
      where: { slug: e.slug },
      update: {
        title: e.title,
        date: e.date,
        promotion: e.promotion,
        venue: e.venue ?? null,
        type: e.type ?? null,
        description: e.description ?? null,
        startTime: e.startTime ?? null,
        endTime: e.endTime ?? null,
      },
      create: e,
    });
  }

  const created = await prisma.event.findMany({
    where: { slug: { in: events.map((e) => e.slug) } },
    select: { id: true, slug: true, title: true, date: true, startTime: true, endTime: true },
    orderBy: { date: "asc" },
  });

  console.log("Upserted events:");
  for (const e of created) {
    console.log(
      `- ${e.slug} | ${e.title} | date=${e.date.toISOString()} start=${e.startTime ? e.startTime.toISOString() : "-"} end=${e.endTime ? e.endTime.toISOString() : "-"}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

