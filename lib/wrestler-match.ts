/**
 * Resolve a scraped wrestler name to an existing wrestler.
 *
 * The importers used to treat any name that *contained* another as the same person
 * ("Akira Tozawa" -> "OZAWA", "Ariya Daivari" -> "Ivar"). This only accepts:
 *   1. the same name (ignoring case, accents, punctuation),
 *   2. a known alias,
 *   3. the same words in a different order ("Naito Tetsuya" / "Tetsuya Naito").
 * Anything else is treated as a new wrestler.
 */
export function normName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/["'`’‘“”.]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const tokenKey = (name: string) => "t:" + normName(name).split(" ").filter(Boolean).sort().join(" ");

export interface MatchableWrestler {
  id: string;
  name: string;
  aliases?: { alias: string }[];
}

export type WrestlerMap<T extends MatchableWrestler = MatchableWrestler> = Map<string, T>;

export function addWrestler<T extends MatchableWrestler>(map: WrestlerMap<T>, w: T, withAliases = true) {
  const names = [w.name, ...(withAliases ? (w.aliases ?? []).map((a) => a.alias) : [])];
  for (const n of names) {
    const exact = normName(n);
    if (exact && !map.has(exact)) map.set(exact, w);
    const tk = tokenKey(n);
    // Only index word-order variants of multi-word names; single words are too ambiguous.
    if (exact.includes(" ") && !map.has(tk)) map.set(tk, w);
  }
  // Canonical names always win over someone else's alias.
  map.set(normName(w.name), w);
}

/** Same wrestler row, but `aliases` optional so freshly-created wrestlers can be added too. */
export type Indexed<T> = Omit<T, "aliases"> & { aliases?: { alias: string }[] };

export function buildWrestlerMap<T extends MatchableWrestler>(wrestlers: T[]): WrestlerMap<Indexed<T> & MatchableWrestler> {
  const map: WrestlerMap<Indexed<T> & MatchableWrestler> = new Map();
  // Names first so an alias can never shadow a real name.
  for (const w of wrestlers) map.set(normName(w.name), w);
  for (const w of wrestlers) addWrestler(map, w);
  return map;
}

export function findWrestler<T extends MatchableWrestler>(map: WrestlerMap<T>, rawName: string): T | undefined {
  const exact = normName(rawName);
  const direct = map.get(exact) ?? (exact.includes(" ") ? map.get(tokenKey(rawName)) : undefined);
  if (direct || exact.length < 4) return direct;

  // Shortened / extended ring names ("Trent" vs "Trent Beretta", "Andrade" vs "Andrade El Idolo"):
  // whole-word containment either way, and only when exactly one wrestler fits. Never substrings
  // inside a word ("Ivar" must not match "Ariya Daivari").
  const q = new Set(exact.split(" "));
  const hits = new Map<string, T>();
  for (const w of map.values()) {
    if (hits.has(w.id)) continue;
    for (const n of [w.name, ...(w.aliases ?? []).map((a) => a.alias)]) {
      const t = new Set(normName(n).split(" "));
      const [small, big] = t.size <= q.size ? [t, q] : [q, t];
      const shortest = [...small].join("");
      if (shortest.length >= 4 && [...small].every((x) => big.has(x))) {
        hits.set(w.id, w);
        break;
      }
    }
    if (hits.size > 1) return undefined;
  }
  return hits.size === 1 ? [...hits.values()][0] : undefined;
}
