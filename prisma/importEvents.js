import fs from 'fs';
import csv from 'csv-parser';
import { PrismaClient } from '@prisma/client';
import { getTmdbPoster } from '../lib/getTmdbPoster.js';
import { scrapeMatchesFromProfightDB } from '../lib/scraper.js';
import slugify from 'slugify';

const prisma = new PrismaClient();

function loadCsv(file) {
    return new Promise((resolve) => {
        const results = [];
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

function isTV(name) {
    return ['raw', 'smackdown', 'nxt', 'impact'].some(tv =>
        name.toLowerCase().includes(tv)
    );
}

async function importEvents() {
    console.log('📡 Script started');

    const rows = await loadCsv('events_to_import.csv');
    console.log(`📥 Loaded ${rows.length} events from CSV.`);

    for (const row of rows) {
        const baseTitle = row.title.trim().replace(/–?\s*\d{4}-\d{2}-\d{2}$/, '');        const dateStr = new Date(row.date).toISOString().split('T')[0];
        const title = `${baseTitle} – ${dateStr}`;
        const slug = slugify(title, { lower: true });
        const { promotion, profightdbUrl } = row;

        const existing = await prisma.event.findUnique({ where: { slug } });
        if (existing) {
            console.log(`⚠️ Skipping existing: ${title}`);
            continue;
        }

        const year = new Date(dateStr).getFullYear();
        let posterUrl = '';
        let description = '';
        let tmdbId = null;

        const lowerTitle = baseTitle.toLowerCase();

        if (lowerTitle.includes('raw')) posterUrl = '/posters/wwe-raw.jpg';
        else if (lowerTitle.includes('smackdown')) posterUrl = '/posters/wwe-smackdown.jpg';
        else if (lowerTitle.includes('nxt')) posterUrl = '/posters/wwe-nxt.jpg';
        else if (lowerTitle.includes('collision')) posterUrl = '/posters/aew-collision.jpg';
        else if (lowerTitle.includes('dynamite')) posterUrl = '/posters/aew-dynamite.jpg';
        else if (lowerTitle.includes('impact')) posterUrl = '/posters/tna-impact.jpg';
        else {
            const result = await getTmdbPoster(baseTitle, year);
            posterUrl = result.posterUrl;
            description = result.description;
            tmdbId = result.tmdbId;
        }
        const event = await prisma.event.create({
            data: {
                title,
                slug,
                date: new Date(dateStr),
                promotion,
                posterUrl,
                description,
                tmdbId,
                profightdbUrl: profightdbUrl || null,
                type: isTV(baseTitle) ? 'tv' : 'ppv',
            },
        });

        console.log(`✅ Added: ${title}`);

        if (profightdbUrl) {
            try {
                await scrapeMatchesFromProfightDB(event.id, profightdbUrl);
                console.log(`🎯 Imported matches for ${title}`);
            } catch (err) {
                console.warn(`⚠️ Failed to import matches for ${title}: ${err.message}`);
            }
        }
    }

    console.log('🎉 Done importing events.');
    await prisma.$disconnect();
}

importEvents().catch(console.error);