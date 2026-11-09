/**
 * Repair match lineups + team numbers from each match's result text.
 *
 *   npx tsx scripts/apply-lineups.ts --log=<file>           # dry run (default)
 *   npx tsx scripts/apply-lineups.ts --apply --log=<file>   # write
 *
 * Per match (one transaction each):
 *   - participants the text doesn't mention are removed (wrongly linked wrestlers, managers),
 *   - missing ones are added (creating the wrestler only if nobody plausible exists),
 *   - every participant gets its team number from the text,
 *   - isWinner is set ONLY on added participants (existing winner flags are never changed).
 * Every change is written to the log (with created wrestler ids) so it can be audited / undone.
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";
import { parseResultSides } from "../lib/result-sides";
import { buildWrestlerMap, findWrestler, addWrestler, normName } from "../lib/wrestler-match";

const apply = process.argv.includes("--apply");
const logPath = process.argv.find((a) => a.startsWith("--log="))?.slice(6) ?? "apply-lineups-log.json";
const prisma = new PrismaClient();

const slugify = (n: string) => n.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
// Stable / team labels the parser can't always tell apart from people — never create these as wrestlers.
const NOT_WRESTLERS = new Set(["los tranquilos de japon", "expressions"]);
const words = (n: string) => new Set(normName(n).split(" "));
/** Whole-word containment either way, e.g. "Penta" vs "Penta El Zero Miedo". */
const sameName = (a: string, b: string) => {
  const [x, y] = [words(a), words(b)];
  const [small, big] = x.size <= y.size ? [x, y] : [y, x];
  return [...small].join("").length >= 4 && [...small].every((t) => big.has(t));
};
const junk = (n: string) => NOT_WRESTLERS.has(normName(n)) || n.length < 3 || /[?!]|title change|\bby\b|no contest|^\d+$/i.test(n);

(async () => {
  const [wrestlers, matches] = await Promise.all([
    prisma.wrestler.findMany({ include: { aliases: true } }),
    prisma.match.findMany({
      where: { participants: { some: {} } },
      select: {
        id: true, title: true, type: true, result: true, event: { select: { title: true } },
        participants: { orderBy: { id: "asc" }, select: { id: true, team: true, isWinner: true, wrestlerId: true, wrestler: { select: { name: true } } } },
      },
    }),
  ]);
  const map = buildWrestlerMap(wrestlers);
  const slugs = new Set(wrestlers.map((w) => w.slug));
  const created = new Map<string, { id: string; name: string; slug: string }>(); // normName -> created
  const log: any[] = [];
  const tally = { scanned: matches.length, skippedUnparsed: 0, skippedJunk: 0, skippedDup: 0, ok: 0, teamsOnly: 0, repaired: 0, wrestlersCreated: 0, participantsRemoved: 0, participantsAdded: 0 };

  const newWrestler = async (name: string) => {
    const key = normName(name);
    const hit = created.get(key);
    if (hit) return hit;
    let base = slugify(name) || "wrestler", slug = base, i = 2;
    while (slugs.has(slug)) slug = `${base}-${i++}`;
    slugs.add(slug);
    const w = apply ? await prisma.wrestler.create({ data: { name, slug } }) : { id: `DRY-${slug}`, name, slug };
    created.set(key, { id: w.id, name, slug });
    addWrestler(map, { id: w.id, name, aliases: [] } as any);
    tally.wrestlersCreated++;
    log.push({ op: "createWrestler", id: w.id, name, slug });
    return w;
  };

  for (const m of matches) {
    const parsed = parseResultSides(m.result);
    if (!parsed) { tally.skippedUnparsed++; continue; }
    const flat = parsed.sides.flatMap((side, si) => side.map((name) => ({ name, team: si + 1, winner: parsed.winner === si })));
    if (flat.some((e) => junk(e.name))) { tally.skippedJunk++; continue; }

    // Resolve without creating first, so we can bail out before any write.
    const resolved = flat.map((e) => ({ ...e, w: findWrestler(map, e.name) }));
    // An unresolved name that is a whole-word match for exactly one current participant (not otherwise
    // claimed) is that participant — don't swap them for a duplicate.
    const claimed = new Set(resolved.map((r) => r.w?.id).filter(Boolean) as string[]);
    for (const r of resolved) {
      if (r.w) continue;
      const cands = m.participants.filter((p) => !claimed.has(p.wrestlerId) && sameName(p.wrestler.name, r.name));
      if (cands.length === 1) {
        r.w = wrestlers.find((x) => x.id === cands[0].wrestlerId);
        claimed.add(cands[0].wrestlerId);
      }
    }
    const ids = resolved.map((r) => r.w?.id).filter(Boolean) as string[];
    if (new Set(ids).size !== ids.length) { tally.skippedDup++; continue; }
    const names = resolved.map((r) => normName(r.name));
    if (new Set(names).size !== names.length) { tally.skippedDup++; continue; }

    const have = new Map(m.participants.map((p) => [p.wrestlerId, p]));
    const want = new Set(ids);
    const missing = resolved.filter((r) => !r.w || !have.has(r.w.id));
    const remove = m.participants.filter((p) => !want.has(p.wrestlerId));
    const teamChanges = resolved.filter((r) => r.w && have.has(r.w.id) && have.get(r.w.id)!.team !== r.team);

    if (missing.length === 0 && remove.length === 0 && teamChanges.length === 0) { tally.ok++; continue; }
    if (missing.length === 0 && remove.length === 0) tally.teamsOnly++; else tally.repaired++;

    // Create wrestlers + build the transaction
    const adds: { wrestlerId: string; team: number; isWinner: boolean; name: string }[] = [];
    for (const r of missing) {
      const w = r.w ?? (await newWrestler(r.name));
      adds.push({ wrestlerId: w.id, team: r.team, isWinner: r.winner, name: r.name });
    }
    const entry = {
      op: "match", matchId: m.id, event: m.event.title, title: m.title, result: m.result,
      removed: remove.map((p) => ({ participantId: p.id, wrestlerId: p.wrestlerId, name: p.wrestler.name, team: p.team, isWinner: p.isWinner })),
      added: adds,
      teamChanges: teamChanges.map((r) => ({ participantId: have.get(r.w!.id)!.id, name: r.name, from: have.get(r.w!.id)!.team, to: r.team })),
    };
    log.push(entry);
    tally.participantsRemoved += remove.length;
    tally.participantsAdded += adds.length;

    if (apply) {
      await prisma.$transaction([
        ...(remove.length ? [prisma.matchParticipant.deleteMany({ where: { id: { in: remove.map((p) => p.id) } } })] : []),
        ...adds.map((a) => prisma.matchParticipant.create({ data: { matchId: m.id, wrestlerId: a.wrestlerId, team: a.team, isWinner: a.isWinner } })),
        ...teamChanges.map((r) => prisma.matchParticipant.update({ where: { id: have.get(r.w!.id)!.id }, data: { team: r.team } })),
      ]);
    }
  }

  writeFileSync(logPath, JSON.stringify({ apply, tally, log }, null, 2));
  console.log(apply ? "APPLIED" : "DRY RUN", JSON.stringify(tally, null, 2));
  console.log("log:", logPath);
})().finally(() => prisma.$disconnect());
