// Find a profile photo for a wrestler via TMDB's person database.
// Matching is deliberately strict: a wrong photo is worse than no photo, so a
// result must match the name exactly AND show wrestling credits.

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

export interface TmdbSearchPerson {
  id: number;
  name: string;
  profile_path: string | null;
  popularity?: number;
  known_for?: { title?: string; name?: string; overview?: string }[];
}

export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const WRESTLING_RE =
  /wrestl|\bwwe\b|\bwwf\b|\bwcw\b|\becw\b|\baew\b|\bnxt\b|\btna\b|\bimpact\b|smackdown|\braw\b|nwa|njpw|new japan|pro wrestling|ring of honor|royal rumble|summerslam|survivor series|money in the bank|lucha/i;

export function hasWrestlingCredit(text: string): boolean {
  return WRESTLING_RE.test(text);
}

/** Pure matcher so it can be unit tested without the network. */
export function pickPerson(
  wrestlerName: string,
  results: TmdbSearchPerson[],
): { person: TmdbSearchPerson; confident: boolean } | null {
  const target = normalizeName(wrestlerName);
  const exact = results.filter((r) => r.profile_path && normalizeName(r.name) === target);
  if (exact.length === 0) return null;

  const withCredit = exact.filter((r) =>
    (r.known_for ?? []).some((k) => hasWrestlingCredit(`${k.title ?? ""} ${k.name ?? ""}`)),
  );
  if (withCredit.length > 0) {
    withCredit.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
    return { person: withCredit[0], confident: true };
  }
  // Exact name but no obvious wrestling credit: caller may verify via biography.
  exact.sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
  return { person: exact[0], confident: false };
}

async function tmdb<T>(path: string): Promise<T> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`https://api.themoviedb.org/3${path}${sep}api_key=${key}&language=en-US`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`TMDB ${res.status}`);
  return res.json() as Promise<T>;
}

/** Does an alias list contain the wrestler's ring name? */
export function aliasMatches(wrestlerName: string, aliases: string[] | undefined): boolean {
  const target = normalizeName(wrestlerName);
  return (aliases ?? []).some((a) => normalizeName(a) === target);
}

export interface ImageLookup {
  imageUrl: string | null;
  tmdbId?: number;
  reason: string;
}

export async function findWrestlerImage(name: string): Promise<ImageLookup> {
  const search = await tmdb<{ results: TmdbSearchPerson[] }>(
    `/search/person?query=${encodeURIComponent(name)}&page=1`,
  );
  const picked = pickPerson(name, search.results ?? []);
  if (!picked) {
    // Ring names are often aliases of a real name (e.g. "Roman Reigns" → "Joe Anoa'i").
    // Only consider candidates that already show wrestling credits, and require the
    // ring name to appear in their alias list.
    const candidates = (search.results ?? [])
      .filter(
        (r) =>
          r.profile_path &&
          (r.known_for ?? []).some((k) => hasWrestlingCredit(`${k.title ?? ""} ${k.name ?? ""}`)),
      )
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, 3);
    for (const c of candidates) {
      const details = await tmdb<{ also_known_as?: string[]; biography?: string }>(`/person/${c.id}`);
      if (aliasMatches(name, details.also_known_as)) {
        return { imageUrl: `${TMDB_IMAGE}${c.profile_path}`, tmdbId: c.id, reason: "ring name found in aliases + wrestling credits" };
      }
    }
    return { imageUrl: null, reason: "no exact-name match with a photo" };
  }

  if (!picked.confident) {
    const details = await tmdb<{ biography?: string }>(`/person/${picked.person.id}`);
    if (!hasWrestlingCredit(details.biography ?? "")) {
      return { imageUrl: null, tmdbId: picked.person.id, reason: "name matched but no wrestling link (likely a different person)" };
    }
  }
  return {
    imageUrl: `${TMDB_IMAGE}${picked.person.profile_path}`,
    tmdbId: picked.person.id,
    reason: picked.confident ? "exact name + wrestling credits" : "exact name + wrestling biography",
  };
}
