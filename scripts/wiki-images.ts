/**
 * Find freely licensed photos for AEW wrestlers that have no image, via Wikipedia/Wikimedia Commons.
 *
 *   npx tsx scripts/wiki-images.ts --log=<file>           # dry run (default): writes candidates, saves nothing
 *   npx tsx scripts/wiki-images.ts --apply --log=<file>   # saves candidates marked ok (non-free images are never used)
 *
 * Strict by design (a wrong photo is worse than none):
 *  - the Wikipedia page title, minus any "(wrestler)" suffix, must equal the wrestler's name or one of their aliases
 *  - the page must be in a professional-wrestling category
 *  - the lead image must be on Commons / freely licensed (never a fair-use upload)
 */
import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "node:fs";

const apply = process.argv.includes("--apply");
const logPath = process.argv.find((a) => a.startsWith("--log="))?.slice(6) ?? "wiki-images-log.json";
const promo = process.argv.find((a) => a.startsWith("--promo="))?.slice(8) ?? "AEW";
const prisma = new PrismaClient();
const UA = "PoisonRanaImageFinder/1.0 (wrestling database; image lookup)";

const norm = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Ring names that are shorthand for the Wikipedia article title (verified by hand; the result is still shown for review).
const ALT: Record<string, string[]> = {
  Jericho: ["Chris Jericho"],
  Kofi: ["Kofi Kingston"],
  PAC: ["Pac (wrestler)"],
  Andrade: ["Andrade (wrestler)"],
  Athena: ["Ember Moon"],
  "Matt Jackson": ["Matt Jackson (wrestler)"],
  Hook: ["Hook (wrestler)"],
  Hazuki: ["Hazuki (wrestler)"],
};

async function api(params: Record<string, string>) {
  const qs = new URLSearchParams({ format: "json", origin: "*", maxlag: "5", ...params });
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(900);
    const res = await fetch(`https://en.wikipedia.org/w/api.php?${qs}`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429 || res.status === 503) {
      await sleep(Number(res.headers.get("retry-after") ?? 0) * 1000 || 5000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json() as Promise<any>;
  }
  throw new Error("HTTP 429 (gave up)");
}

async function lookup(names: string[]) {
  const wanted = new Set(names.map(norm));
  const seen = new Set<string>();
  for (const q of names) {
    for (const query of [`${q} professional wrestler`, q]) {
      const s = await api({ action: "query", list: "search", srsearch: query, srlimit: "5" });
      for (const hit of s.query?.search ?? []) {
        const title: string = hit.title;
        if (seen.has(title)) continue;
        seen.add(title);
        if (!wanted.has(norm(title))) continue;
        const p = await api({
          action: "query",
          titles: title,
          prop: "pageimages|categories",
          piprop: "thumbnail|name",
          pithumbsize: "600",
          cllimit: "max",
          redirects: "1",
        });
        const page: any = Object.values(p.query?.pages ?? {})[0];
        if (!page) continue;
        const cats: string[] = (page.categories ?? []).map((c: any) => c.title as string);
        const isWrestler = cats.some((c) => /wrestl/i.test(c));
        const file: string | undefined = page.pageimage;
        const thumb: string | undefined = page.thumbnail?.source;
        if (!isWrestler) return { title, ok: false, reason: "not in a wrestling category" };
        if (!file || !thumb) return { title, ok: false, reason: "page has no lead image" };
        const info = await api({ action: "query", titles: `File:${file}`, prop: "imageinfo", iiprop: "extmetadata|url", iiextmetadatafilter: "LicenseShortName|NonFree|Artist|Credit" });
        const ii: any = (Object.values(info.query?.pages ?? {})[0] as any)?.imageinfo?.[0];
        const meta = ii?.extmetadata ?? {};
        const nonFree = String(meta.NonFree?.value ?? "").toLowerCase() === "true";
        const license: string = meta.LicenseShortName?.value ?? "";
        const onCommons = /upload\.wikimedia\.org\/wikipedia\/commons\//.test(ii?.url ?? thumb);
        if (nonFree || !onCommons || !license) return { title, ok: false, reason: `image not freely licensed (${license || "unknown"}${nonFree ? ", non-free" : ""})` };
        return { title, ok: true, imageUrl: thumb, file, license, reason: "title + wrestling category + free image" };
      }
    }
  }
  return { title: null, ok: false, reason: "no matching Wikipedia page" };
}

(async () => {
  const missing = await prisma.wrestler.findMany({
    where: {
      imageUrl: null,
      matches: { some: { match: { event: { promotion: { contains: promo, mode: "insensitive" } } } } },
    },
    select: { id: true, name: true, aliases: { select: { alias: true } }, _count: { select: { matches: true } } },
    orderBy: { name: "asc" },
  });
  const out: any[] = [];
  for (const w of missing) {
    try {
      const r: any = await lookup([w.name, ...(ALT[w.name] ?? []), ...w.aliases.map((a) => a.alias)]);
      out.push({ id: w.id, name: w.name, matches: w._count.matches, ...r });
      if (r.ok && apply) await prisma.wrestler.update({ where: { id: w.id }, data: { imageUrl: r.imageUrl } });
    } catch (e) {
      out.push({ id: w.id, name: w.name, ok: false, reason: `error: ${e instanceof Error ? e.message : e}` });
    }
  }
  writeFileSync(logPath, JSON.stringify({ apply, found: out.filter((o) => o.ok).length, total: out.length, results: out }, null, 1));
  console.log(`${apply ? "APPLIED" : "dry run"}: ${out.filter((o) => o.ok).length}/${out.length} found`);
  await prisma.$disconnect();
})();
