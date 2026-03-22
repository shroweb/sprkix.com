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

export async function findEventOnTMDB(title: string) {
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
        throw new Error('TMDB_API_KEY is not set in .env. Get a free key at https://www.themoviedb.org/settings/api');
    }

    // Build progressively simpler queries to maximise match rate:
    //
    // "AEW Collision #136 - Slam Dunk Sunday 2026"
    //   1. "AEW Collision - Slam Dunk Sunday 2026"  (remove episode #)
    //   2. "AEW Collision"                           (remove # AND subtitle — best for weekly TV)
    //
    // "WrestleMania 41"
    //   1. "WrestleMania 41"                         (no episode # to strip, matches directly)
    //
    // "WWE Friday Night SmackDown #1387"
    //   1. "WWE Friday Night SmackDown"              (remove episode #)

    const queries = new Set<string>();

    // Pass 1: strip episode number only
    const withoutEpisodeNum = title
        .replace(/\s*#\d+\s*/g, ' ')
        .replace(/[–—]\s*\d{4}\s*$/g, '')         // trailing em-dash + year
        .replace(/\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    if (withoutEpisodeNum) queries.add(withoutEpisodeNum);

    // Pass 2: strip episode number AND subtitle/episode title (everything after " - " or " – ")
    const baseShowName = title
        .replace(/\s*#\d+.*$/g, '')   // remove #N and everything after
        .replace(/\s*[-–—].*$/g, '')  // remove " - subtitle" if no episode num
        .trim();
    if (baseShowName && baseShowName !== withoutEpisodeNum) queries.add(baseShowName);

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
        ];

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