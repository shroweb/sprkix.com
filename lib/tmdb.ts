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
    
    // Clean the title: strip episode numbers (#828), date suffixes, and trailing metadata
    const cleanTitle = title
        .replace(/\s*#\d+\s*/g, ' ')          // Remove #828 style episode numbers
        .replace(/–\s*\d{4}.*$/g, '')          // Remove – 2024 date suffixes
        .replace(/\s*(\d{1,2}\/\d{1,2}\/\d{2,4})\s*/g, ' ')  // Remove date patterns
        .replace(/\s+/g, ' ')
        .trim();
    
    const query = encodeURIComponent(cleanTitle);
    const movieUrl = `https://api.themoviedb.org/3/search/movie?query=${query}&api_key=${apiKey}`;
    const tvUrl = `https://api.themoviedb.org/3/search/tv?query=${query}&api_key=${apiKey}`;
    
    const [movieRes, tvRes] = await Promise.all([fetch(movieUrl), fetch(tvUrl)]);
    
    if (!movieRes.ok || !tvRes.ok) {
        throw new Error(`TMDB API error: ${movieRes.status} ${tvRes.status}`);
    }
    
    const movieData = await movieRes.json();
    const tvData = await tvRes.json();
    
    const results = [
        ...(movieData.results || []).map((r: any) => ({ ...r, tmdbType: 'movie' })),
        ...(tvData.results || []).map((r: any) => ({ ...r, tmdbType: 'tv' }))
    ];
    
    if (results.length > 0) {
        // Find best match (highest popularity)
        const best = results.sort((a,b) => b.popularity - a.popularity)[0];
        return {
            posterUrl: best.poster_path ? `https://image.tmdb.org/t/p/w780${best.poster_path}` : null,
            description: best.overview || null,
            matchedTitle: best.title || best.name,
        };
    }
    
    return null;
}