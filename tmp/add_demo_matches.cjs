/* One-off helper to add demo matches into the local DB for the demo events.
   Safe behavior: if an event already has matches, it skips that event. */

const path = require("node:path");
const dotenv = require("dotenv");
const { PrismaClient } = require("@prisma/client");
const slugify = require("slugify");

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

function utcIso(year, month, day, hh, mm) {
  return new Date(Date.UTC(year, month - 1, day, hh, mm, 0));
}

function wrestlerSlug(name) {
  return slugify(name, { lower: true, strict: true });
}

async function ensureWrestlers(prisma, minCount) {
  const existing = await prisma.wrestler.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
  if (existing.length >= minCount) return existing;

  const needed = minCount - existing.length;
  const baseNames = [
    "Atlas King",
    "Nova Riot",
    "Kara Vex",
    "Mason Drake",
    "Jade Valkyrie",
    "Rico Blaze",
    "Hana Storm",
    "Briggs Iron",
    "Sable Fox",
    "Orion Crane",
    "Luca Voltage",
    "Tessa Wild",
  ];

  const created = [];
  for (let i = 0; i < needed; i++) {
    const name = baseNames[i % baseNames.length] + (i >= baseNames.length ? ` ${i + 1}` : "");
    const slug = wrestlerSlug(name);
    const w = await prisma.wrestler.upsert({
      where: { slug },
      update: { name },
      create: {
        name,
        slug,
        bio: "Demo wrestler for local testing.",
      },
      select: { id: true, name: true, slug: true },
    });
    created.push(w);
  }

  return [...existing, ...created];
}

async function main() {
  const prisma = new PrismaClient();

  const eventSlugs = [
    "sprkix-live-friday-fight-night-2026-03-13",
    "sprkix-live-midnight-mat-madness-2026-03-13",
    "sprkix-upcoming-spring-clash-2026",
    "sprkix-upcoming-rumble-night-2026",
  ];

  const events = await prisma.event.findMany({
    where: { slug: { in: eventSlugs } },
    select: { id: true, slug: true, title: true, date: true, startTime: true, endTime: true },
  });

  const bySlug = new Map(events.map((e) => [e.slug, e]));
  const missing = eventSlugs.filter((s) => !bySlug.has(s));
  if (missing.length) {
    throw new Error(`Missing events for slugs: ${missing.join(", ")}`);
  }

  const wrestlers = await ensureWrestlers(prisma, 10);

  let createdMatches = 0;

  for (const slug of eventSlugs) {
    const event = bySlug.get(slug);
    const matchCount = await prisma.match.count({ where: { eventId: event.id } });
    if (matchCount > 0) {
      console.log(`Skip ${slug}: already has ${matchCount} matches`);
      continue;
    }

    const isLiveDemo = !!event.startTime && !!event.endTime;
    const matchTotal = isLiveDemo ? 7 : 5;

    for (let i = 0; i < matchTotal; i++) {
      const a = wrestlers[(i * 2) % wrestlers.length];
      const b = wrestlers[(i * 2 + 1) % wrestlers.length];
      const winner = i % 2 === 0 ? a : b;
      const loser = winner.id === a.id ? b : a;

      const order = i + 1;
      const duration = 8 * 60 + (i % 5) * 60 + 30; // seconds

      const match = await prisma.match.create({
        data: {
          eventId: event.id,
          order,
          title: `${a.name} vs ${b.name}`,
          type: "Singles",
          duration,
          result: `${winner.name} def. ${loser.name}`,
          participants: {
            create: [
              { wrestlerId: a.id, team: 1, isWinner: a.id === winner.id },
              { wrestlerId: b.id, team: 2, isWinner: b.id === winner.id },
            ],
          },
        },
        select: { id: true, title: true },
      });

      createdMatches++;

      // For the live demos, set the currentMatchOrder to 1 (start of card).
      if (isLiveDemo && order === 1) {
        await prisma.event.update({
          where: { id: event.id },
          data: { currentMatchOrder: 1 },
        });
      }

      // Add a couple of placeholder ratings for variety (optional).
      if (order === 1 || order === matchTotal) {
        // These fields are optional; only create if there is at least one user.
        const u = await prisma.user.findFirst({ select: { id: true } });
        if (u) {
          await prisma.matchRating.upsert({
            where: { userId_matchId: { userId: u.id, matchId: match.id } },
            update: { rating: 4.0 },
            create: { userId: u.id, matchId: match.id, rating: 4.0 },
          });
        }
      }
    }

    console.log(`Created ${matchTotal} matches for ${slug}`);
  }

  console.log(`Done. Created ${createdMatches} matches total.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

