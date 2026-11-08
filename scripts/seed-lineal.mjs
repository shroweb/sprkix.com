// Seed the first lineal titles. Safe to re-run: existing titles are left untouched.
// Usage: node scripts/seed-lineal.mjs   (reads DIRECT_URL / DATABASE_URL from .dev.vars)
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);

const env = Object.fromEntries(
  readFileSync(new URL("../.dev.vars", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    }),
);
process.env.DATABASE_URL = env.DIRECT_URL || env.DATABASE_URL;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Roman Reigns became the holder by beating Sami Zayn at Crown Jewel 2026.
const SEED_WRESTLER_SLUG = "roman-reigns";
const SEED_MATCH_ID = "cmw7fc0n4001rrv1o1m51ef36"; // Roman Reigns defeats Sami Zayn
const SEED_DATE = new Date("2026-11-07T00:00:00.000Z");

const TITLES = [
  {
    slug: "wcw-world-heavyweight",
    name: "WCW World Heavyweight Title",
    emoji: "🌍",
    kind: "title",
    origin: "Lineage of the WCW World Heavyweight Championship, carried forward by whoever beats the holder.",
    sortOrder: 1,
  },
  {
    slug: "wwe-world-heavyweight-02-13",
    name: "WWE World Heavyweight Title ('02–'13)",
    emoji: "🏆",
    kind: "title",
    origin: "The original World Heavyweight Championship line from 2002 to 2013.",
    sortOrder: 2,
  },
  {
    slug: "wwe-european",
    name: "WWE European Title",
    emoji: "🇪🇺",
    kind: "title",
    origin: "The European Championship, tracked as a lineal prize long after the belt was retired.",
    sortOrder: 3,
  },
  {
    slug: "dominik-mysterio-custody",
    name: "Custody of Dominik Mysterio",
    emoji: "👶",
    kind: "novelty",
    origin: "Won and lost in the ring. Whoever beats the holder takes custody.",
    sortOrder: 4,
  },
  {
    slug: "cm-punk-real-aew-world",
    name: "CM Punk's \"Real\" AEW World Title",
    emoji: "🥊",
    kind: "title",
    origin: "The AEW belt as it left the company with CM Punk. Roman Reigns has held it since beating Punk at WrestleMania 42; tracked here from Crown Jewel 2026.",
    sortOrder: 5,
  },
];

const wrestler = await prisma.wrestler.findUnique({ where: { slug: SEED_WRESTLER_SLUG } });
if (!wrestler) throw new Error(`Wrestler ${SEED_WRESTLER_SLUG} not found`);

for (const t of TITLES) {
  const existing = await prisma.linealTitle.findUnique({ where: { slug: t.slug } });
  if (existing) {
    console.log("exists:", t.slug);
    continue;
  }
  const created = await prisma.linealTitle.create({ data: t });
  await prisma.linealReign.create({
    data: {
      titleId: created.id,
      wrestlerId: wrestler.id,
      reignNumber: 1,
      startedAt: SEED_DATE,
      startMatchId: SEED_MATCH_ID,
      source: "seed",
      note: "Starting point: Roman Reigns defeated Sami Zayn at Crown Jewel 2026.",
    },
  });
  console.log("created:", t.slug);
}
await prisma.$disconnect();
