/** Dry run: compare stored participants with the lineup in each match's result text. Writes a JSON report only. */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { parseResultSides } from "../lib/result-sides";
import { buildWrestlerMap, findWrestler } from "../lib/wrestler-match";

const prisma = new PrismaClient();
const out = process.argv.find((a) => a.startsWith("--report="))?.slice(9) ?? "lineups-report.json";

(async () => {
  const [wrestlers, matches] = await Promise.all([
    prisma.wrestler.findMany({ include: { aliases: true } }),
    prisma.match.findMany({
      where: { participants: { some: {} } },
      select: {
        id: true, title: true, type: true, result: true,
        event: { select: { title: true } },
        participants: { orderBy: { id: "asc" }, select: { id: true, team: true, isWinner: true, wrestlerId: true, wrestler: { select: { name: true } } } },
      },
    }),
  ]);
  const map = buildWrestlerMap(wrestlers);
  const byId = new Map(wrestlers.map((w) => [w.id, w.name]));

  const cls = { unparsed: 0, ok: 0, teamsOnly: 0, repair: 0, ambiguous: 0 };
  const rows: any[] = [];
  let multi = 0;

  for (const m of matches) {
    const isTeam = /\b(tag|trios?|six[\s-]?man|eight[\s-]?man|ten[\s-]?man|\d[\s-]?man|three[\s-]?way|four[\s-]?way|fatal|triple threat)\b/i.test(`${m.type} ${m.title}`);
    if (m.participants.length < 3 && !isTeam) continue;
    multi++;
    const parsed = parseResultSides(m.result);
    if (!parsed) { cls.unparsed++; continue; }

    // Expected lineup from text
    const expected = parsed.sides.flatMap((side, si) =>
      side.map((name) => ({ name, team: si + 1, winner: parsed.winner === si, w: findWrestler(map, name) })),
    );
    const ids = expected.map((e) => e.w?.id).filter(Boolean) as string[];
    if (new Set(ids).size !== ids.length) { cls.ambiguous++; rows.push({ kind: "ambiguous", matchId: m.id, event: m.event.title, title: m.title, result: m.result }); continue; }

    const have = new Set(m.participants.map((p) => p.wrestlerId));
    const want = new Set(ids);
    const missing = expected.filter((e) => !e.w || !have.has(e.w.id));
    const extra = m.participants.filter((p) => !want.has(p.wrestlerId));
    const sizes = parsed.sides.map((s) => s.length);

    if (missing.length === 0 && extra.length === 0) {
      const sameTeams = expected.every((e) => m.participants.find((p) => p.wrestlerId === e.w!.id)?.team === e.team);
      if (sameTeams) cls.ok++;
      else {
        cls.teamsOnly++;
        rows.push({ kind: "teamsOnly", matchId: m.id, event: m.event.title, title: m.title, sizes, plan: expected.map((e) => ({ id: e.w!.id, name: e.name, team: e.team })) });
      }
      continue;
    }
    cls.repair++;
    rows.push({
      kind: "repair", matchId: m.id, event: m.event.title, title: m.title, result: m.result, sizes,
      add: missing.map((e) => ({ name: e.name, team: e.team, existingId: e.w?.id ?? null })),
      remove: extra.map((p) => ({ participantId: p.id, name: p.wrestler.name })),
      plan: expected.map((e) => ({ id: e.w?.id ?? null, name: e.name, team: e.team, winner: e.winner })),
    });
  }

  writeFileSync(out, JSON.stringify({ multi, cls, rows }, null, 2));
  const newNames = new Set(rows.filter((r) => r.kind === "repair").flatMap((r) => r.add.filter((a: any) => !a.existingId).map((a: any) => a.name)));
  console.log(JSON.stringify({ multi, ...cls, newWrestlersNeeded: newNames.size }, null, 2));
  console.log("sample new wrestlers:", [...newNames].slice(0, 25).join(" | "));
  console.log("sample wrong links:", rows.filter((r) => r.kind === "repair").flatMap((r) => r.remove.map((x: any) => x.name)).slice(0, 25).join(" | "));
})().finally(() => prisma.$disconnect());
