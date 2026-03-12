import { PrismaClient } from '@prisma/client';
import { getTmdbPoster } from '../lib/getTmdbPoster.js';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Fetching missing posters...');
    const events = await prisma.event.findMany({
        where: { posterUrl: null },
        orderBy: { date: 'desc' },
    });

    for (const event of events) {
        const { posterUrl, description, tmdbId } = await getTmdbPoster(event.title, new Date(event.date).getFullYear());

        if (posterUrl || description || tmdbId) {
            await prisma.event.update({
                where: { id: event.id },
                data: {
                    ...(posterUrl && { posterUrl }),
                    ...(description && { description }),
                    ...(tmdbId && { tmdbId }),
                },
            });
            console.log(`✅ Updated: ${event.title}`);
        } else {
            console.log(`❌ No poster found: ${event.title}`);
        }
    }

    console.log('🎯 Done.');
}

main()
    .catch((err) => console.error('❌ Fetch failed:', err))
    .finally(() => prisma.$disconnect());