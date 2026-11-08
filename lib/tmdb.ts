export async function fetchWrestlingTVShows(query = "wrestling") {
    const apiKey = process.env.TMDB_API_KEY
    const url = `https://api.themoviedb.org/3/search/tv?query=${encodeURIComponent(query)}&api_key=${apiKey}`

    const res = await fetch(url)
    const data = await res.json()

    const allowedPromotions = ["WWE", "AEW", "ROH", "TNA", "Impact", "Raw", "SmackDown", "NXT", "Dynamite", "Collision", "NJPW", "Evolve"]
    return data.results
        .filter((item: any) => {
            return allowedPromotions.some((promo) =>
                item.name.toLowerCase().includes(promo.toLowerCase())
            )
        })
        .map((item: any) => ({
            id: item.id,
            name: item.name,
            slug: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            date: item.first_air_date,
            poster: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
        }))
}

// ── Wrestler / person search ─────────────────────────────────────────────────

const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

export type TmdbPersonResult = {
  id: number;
  name: string;
  known_for_department: string;
  imageUrl: string | null;
};

export async function searchTmdbPeople(query: string): Promise<TmdbPersonResult[]> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  const url = `https://api.themoviedb.org/3/search/person?query=${encodeURIComponent(query)}&api_key=${key}&language=en-US&page=1`;
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`TMDB search failed: ${res.status}`);
  const data = await res.json();
  return ((data.results || []) as any[]).slice(0, 8).map((p) => ({
    id: p.id,
    name: p.name,
    known_for_department: p.known_for_department ?? "",
    imageUrl: p.profile_path ? `${TMDB_IMAGE}${p.profile_path}` : null,
  }));
}

export async function getTmdbPerson(tmdbId: number): Promise<{ imageUrl: string | null; bio: string | null }> {
  const key = process.env.TMDB_API_KEY;
  if (!key) throw new Error("TMDB_API_KEY is not set");
  const url = `https://api.themoviedb.org/3/person/${tmdbId}?api_key=${key}&language=en-US`;
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`TMDB person fetch failed: ${res.status}`);
  const p = await res.json();
  return {
    imageUrl: p.profile_path ? `${TMDB_IMAGE}${p.profile_path}` : null,
    bio: p.biography || null,
  };
}

// ── Event search ─────────────────────────────────────────────────────────────

export function buildEventTmdbQueries(title: string): string[] {
    const cleanTitle = title
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
        .replace(/(#\d{1,2})\d\.\d{2}(\d+)/g, '$1$2')
        .replace(/(#\d{1,2})\.\d{2}(\d+)/g, '$1$2')
        .replace(/\d{1,2}\.\d{1,2}(?=#\d+)/g, '')
        .replace(/([a-zA-Z])\d{1,2}\.\d{1,2}/g, '$1')
        .replace(/\d{1,2}\.\d{1,2}([a-zA-Z])/g, '$1')
        .replace(/\d{1,2}\.\d{1,2}(-)/g, '$1')
        .replace(/\s+\d{1,2}\.\d{1,2}(?=\s|$)/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const queries = new Set<string>();
    const withoutEpisodeNum = cleanTitle
        .replace(/\s*#\d+\s*/g, ' ')
        .replace(/[–—]\s*\d{4}\s*$/g, '')
        .replace(/\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (withoutEpisodeNum) queries.add(withoutEpisodeNum);

    const baseShowName = cleanTitle
        .replace(/\s*#\d+.*$/g, '')
        .replace(/\s*[-–—].*$/g, '')
        .trim();
    if (baseShowName) queries.add(baseShowName);

    // Pre-shows and tour-card suffixes are rarely separate TMDB entries. A
    // final parent-event query can still recover the main event artwork.
    const parentEvent = withoutEpisodeNum
        .replace(/\s+(?:countdown\s+to|zero\s+hour|kickoff|pre[- ]?show)\s+/i, ' ')
        .replace(/\s*[-–—]\s*(?:tag|night|day)\s*\d+.*$/i, '')
        .replace(/\s+/g, ' ')
        .trim();
    if (parentEvent) queries.add(parentEvent);

    return [...queries];
}

export async function findEventOnTMDB(title: string) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB_API_KEY is not set in .env. Get a free key at https://www.themoviedb.org/settings/api');
    }

    const queries = buildEventTmdbQueries(title);

    for (const q of queries) {
        const encoded = encodeURIComponent(q);
        const [movieRes, tvRes] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/search/movie?query=${encoded}&api_key=${apiKey}`),
            fetch(`https://api.themoviedb.org/3/search/tv?query=${encoded}&api_key=${apiKey}`),
        ]);
        if (!movieRes.ok || !tvRes.ok) continue;

        const movieData = await movieRes.json();
        const tvData = await tvRes.json();

        const results = [
            ...(movieData.results || []).map((r: any) => ({ ...r, tmdbType: 'movie' })),
            ...(tvData.results || []).map((r: any) => ({ ...r, tmdbType: 'tv' })),
        ].filter((item: any) => {
            const titleOrName = (item.title || item.name || '').toLowerCase();
            const overview = (item.overview || '').toLowerCase();
            // Filter out non-wrestling false positive movie matches:
            if (
                titleOrName === 'noah' ||
                titleOrName === 'the noah' ||
                titleOrName.startsWith('noah:') ||
                titleOrName.includes("noah's") ||
                overview.includes('russell crowe') ||
                overview.includes('ark') ||
                overview.includes('great flood') ||
                overview.includes('biblical')
            ) {
                return false;
            }
            return true;
        });

        if (results.length > 0) {
            const best = results.sort((a: any, b: any) => b.popularity - a.popularity)[0];
            return {
                posterUrl: best.poster_path ? `https://image.tmdb.org/t/p/w780${best.poster_path}` : null,
                description: best.overview || null,
                matchedTitle: best.title || best.name,
            };
        }
    }

    return null;
}
