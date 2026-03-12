require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const getTmdbPoster = require('../lib/getTmdbPoster');
const prisma = new PrismaClient();

function loadCsv(filePath) {
    return new Promise((resolve) => {
        const results = [];
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results));
    });
}

async function main() {
    console.log('🚀 Starting seedEvents.js...');
    const filePath = path.join(process.cwd(), 'events_seed.csv');
    const rows = await loadCsv(filePath);

    console.log(`📥 Loaded ${rows.length} events from CSV.`);

    for (const row of rows) {
        const exists = await prisma.event.findUnique({ where: { slug: row.slug } });
        if (exists) {
            if (!exists.posterUrl || !exists.description) {
                try {
                    const { posterUrl, description } = await getTmdbPoster(row.title, new Date(row.date).getFullYear());
                    if (posterUrl || description) {
                        await prisma.event.update({
                            where: { slug: row.slug },
                            data: {
                                ...(posterUrl && { posterUrl }),
                                ...(description && { description }),
                            },
                        });
                        console.log(`🖼️ Updated data for: ${row.title}`);
                    } else {
                        console.warn(`❌ No TMDb data found for: ${row.title}`);
                    }
                } catch (err) {
                    console.error(`❌ Error fetching TMDb data for "${row.title}":`, err.message);
                }
            } else {
                console.warn(`⚠️ Skipping existing: ${row.title}`);
            }
            continue;
        }

        const event = await prisma.event.create({
            data: {
                title: row.title,
                slug: row.slug,
                date: new Date(row.date),
                promotion: row.promotion,
                posterUrl: row.posterUrl || undefined,
                description: row.description || undefined,
                profightdbUrl: row.profightdbUrl || undefined,
                createdAt: new Date(row.createdAt),
            },
        });

        if (!event.posterUrl) {
            const { posterUrl, description } = await getTmdbPoster(event.title, new Date(event.date).getFullYear());
            if (posterUrl) {
                await prisma.event.update({
                    where: { id: event.id },
                    data: { posterUrl, description },
                });
                console.log(`✅ Poster added: ${event.title}`);
            } else {
                console.log(`❌ No poster found: ${event.title}`);
            }
        }
    }

    console.log('🎉 Done seeding events.');
}

main()
    .catch((e) => {
        console.error('❌ Error in seedEvents.js:', e);
    })
    .finally(() => prisma.$disconnect());