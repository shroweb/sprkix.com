const axios = require('axios');
require('dotenv').config();

const TMDB_BASE = 'https://api.themoviedb.org/3';

async function getTmdbPoster(title, year) {
    function scoreResult(r, title, year) {
        let score = 0;
        const t = (r.title || '').toLowerCase();
        const lowerTitle = title.toLowerCase();

        if (t === lowerTitle) score += 10;
        else if (t.includes(lowerTitle)) score += 5;

        const date = r.release_date || r.first_air_date || '';
        if (date.startsWith(String(year))) score += 3;

        if ((t.match(/\s+/g) || []).length <= 4) score += 1;
        if (r.poster_path) score += 1;

        return score;
    }

    const url = `${TMDB_BASE}/search/movie?query=${encodeURIComponent(title)}&year=${year}`;

    try {
        const res = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${process.env.TMDB_BEARER_TOKEN}`,
            },
        });

        const EXCLUDE_KEYWORDS = [
            'kickoff', 'pre-show', 'post-show', 'post show', 'buy in', 'buy-in',
            'backstage', 'talking smack', 'panel', 'aftermath', 'countdown', 'road to',
            'press conference'
        ];

        function isValidMatch(result) {
            const title = (result.title || result.name || '').toLowerCase().replace(/[-:]/g, ' ');
            return !EXCLUDE_KEYWORDS.some(kw => title.includes(kw));
        }

        const results = (res.data.results || []).filter(isValidMatch);

        if (!results.length) {
            console.warn(`❌ No TMDb results for: ${title} (${year})`);
            return { posterUrl: null, description: null, tmdbId: null };
        }

        // Ranked scoring system to select the best match
        results.sort((a, b) => scoreResult(b, title, year) - scoreResult(a, title, year));
        const chosen = results[0];

        return {
            posterUrl: chosen.poster_path
                ? `https://image.tmdb.org/t/p/w500${chosen.poster_path}`
                : '/fallbacks/event-poster.png',
            description: chosen.overview || null,
            tmdbId: chosen.id || null,
        };

    } catch (err) {
        console.warn(`❌ TMDb fetch failed for "${title}" (${year}):`, err.message);
        return { posterUrl: null, description: null, tmdbId: null };
    }
}

module.exports = { getTmdbPoster };