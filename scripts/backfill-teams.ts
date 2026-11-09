/**
 * Re-derive MatchParticipant.team for tag / multi-man matches already in the DB.
 *
 *   npx tsx scripts/backfill-teams.ts            # dry run (default): reads only, writes a report
 *   npx tsx scripts/backfill-teams.ts --apply    # writes team numbers (never touches isWinner)
 *
 * Needs DATABASE_URL in the environment (e.g. loaded from .dev.vars).
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { assignTeams } from "../lib/match-teams";
import { inferTeams } from "../lib/match-sides";

const apply = process.argv.includes("--apply");
const reportPath = process.argv.find((a) => a.startsWith("--report="))?.slice(9) ?? "backfill-teams-report.json";
const prisma = new PrismaClient();

type Change = { matchId: string; event: string; title: string; method: "result-text" | "tag-halves" | "multi-team-split"; names: string[]; from: (number | null)[]; to: number[]; rows: { id: string; team: number }[] };

async function main() {
  const matches = await prisma.match.findMany({
    where: { participants: { some: {} } },
    select: {
      id: true, title: true, type: true, result: true,
      event: { select: { title: true, date: true } },
      participants: { orderBy: { id: "asc" }, select: { id: true, team: true, wrestler: { select: { id: true, name: true } } } },
    },
  });

  const stats = { scanned: matches.length, multi: 0, alreadyOk: 0, changed: 0, skippedNoText: 0, skippedNamesMissing: 0, skippedUneven: 0, skippedFfa: 0 };
  const changes: Change[] = [];
  const skipped: { matchId: string; event: string; title: string; reason: string }[] = [];

  for (const m of matches) {
    const ps = m.participants;
    if (ps.length < 3) continue; // singles are fine as-is
    stats.multi++;
    const names = ps.map((p) => p.wrestler.name);
    const result = (m.result ?? "").trim();
    const info = { matchId: m.id, event: m.event.title, title: m.title };

    let to: number[] | null = null;
    let method: Change["method"] = "result-text";

    const lower = result.toLowerCase();
    const hasSep = /\s(defeats?|defeated|def\.|vs\.?|versus)\s/i.test(` ${result} `);
    const isTeamMatch = /\b(tag|trios?|six[\s-]?man|eight[\s-]?man|6[\s-]?man|8[\s-]?man)\b/i.test(`${m.type ?? ""} ${m.title ?? ""}`);
    const namesFound = names.every((n) => lower.includes(n.toLowerCase()));
    // "Three Way / Four Way / Fatal Four Way Tag": k teams of equal size, listed team by team.
    const ways = /\b(five[\s-]?way|5[\s-]?way)\b/i.test(`${m.type} ${m.title}`) ? 5
      : /\b(four[\s-]?way|4[\s-]?way|fatal[\s-]?(four|4))\b/i.test(`${m.type} ${m.title}`) ? 4
      : /\b(three[\s-]?way|3[\s-]?way|triple[\s-]?threat)\b/i.test(`${m.type} ${m.title}`) ? 3 : 0;
    if (isTeamMatch && ways > 0 && ps.length % ways === 0 && ps.length / ways >= 2) {
      const size = ps.length / ways;
      to = ps.map((_, i) => Math.floor(i / size) + 1);
      method = "multi-team-split";
    } else if (result && hasSep && namesFound) {
      to = assignTeams(result, names).teams;
      // Tag/trios matches have equal-sized sides. Anything else means the text and the
      // participant list disagree (missing partner, mis-parsed name) — don't guess.
      if (isTeamMatch && !/handicap/i.test(`${m.type} ${m.title}`)) {
        const sizes = [...new Set(to)].map((t) => to!.filter((x) => x === t).length);
        if (new Set(sizes).size > 1) {
          stats.skippedUneven++;
          skipped.push({ ...info, reason: `uneven sides ${sizes.join("v")}` });
          continue;
        }
      }
    } else if (result && hasSep && !namesFound && !isTeamMatch) {
      stats.skippedNamesMissing++;
      skipped.push({ ...info, reason: "wrestler name not found in result text" });
      continue;
    } else {
      const guess = inferTeams(ps.map((p) => ({ team: null as number | null, wrestler: { id: p.wrestler.id, name: p.wrestler.name } })), m.type, m.title);
      if (guess.some((g) => g.team != null)) {
        to = guess.map((g) => g.team as number);
        method = "tag-halves";
      } else {
        stats.skippedNoText++;
        skipped.push({ ...info, reason: "no result text / not an obvious team match" });
        continue;
      }
    }

    // Battle-royal style (everyone on their own team, big field): nothing useful to store.
    if (new Set(to).size === ps.length && ps.length > 6) {
      stats.skippedFfa++;
      continue;
    }
    // A single side means we learned nothing.
    if (new Set(to).size < 2) {
      stats.skippedNoText++;
      skipped.push({ ...info, reason: "only one side detected" });
      continue;
    }

    const from = ps.map((p) => p.team);
    if (from.every((f, i) => f === to![i])) {
      stats.alreadyOk++;
      continue;
    }
    stats.changed++;
    changes.push({ ...info, method, names, from, to, rows: ps.map((p, i) => ({ id: p.id, team: to![i] })) });
  }

  writeFileSync(reportPath, JSON.stringify({ apply, stats, changes, skipped }, null, 2));
  console.log(JSON.stringify(stats, null, 2));
  console.log(`report: ${reportPath}`);

  if (!apply) {
    console.log("\nDRY RUN — nothing written. Sample changes:");
    for (const c of changes.slice(0, 12)) {
      const groups = new Map<number, string[]>();
      c.names.forEach((n, i) => groups.set(c.to[i], [...(groups.get(c.to[i]) ?? []), n]));
      console.log(`- [${c.method}] ${c.event} · ${c.title}\n    ` + [...groups].map(([t, ns]) => `T${t}: ${ns.join(" & ")}`).join("  vs  "));
    }
    return;
  }

  let done = 0;
  for (const c of changes) {
    await prisma.$transaction(c.rows.map((r) => prisma.matchParticipant.update({ where: { id: r.id }, data: { team: r.team } })));
    if (++done % 50 === 0) console.log(`updated ${done}/${changes.length}`);
  }
  console.log(`APPLIED: ${done} matches updated`);
}

main().finally(() => prisma.$disconnect());
