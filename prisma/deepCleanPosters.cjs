const { PrismaClient } = require('@prisma/client');
const { getTmdbPoster } = require('../lib/getTmdbPoster.cjs');
const prisma = new PrismaClient();

async function deepClean() {
    console.log('🧹 STARTING DEEP CLEAN OF EVENT POSTERS...');
    
    const events = await prisma.event.findMany({
        select: { id: true, title: true, date: true, posterUrl: true }
    });

    console.log(`📊 Found ${events.length} events to verify.`);

    for (const event of events) {
        const year = new Date(event.date).getFullYear();
        // Clean title for search: remove suffixes like " – 2025-01-01"
        const cleanTitle = event.title.replace(/–\s*\d{4}-\d{2}-\d{2}$/, '').trim();
        
        console.log(`🔍 Refreshing: "${cleanTitle}" (${year})...`);
        
        try {
            const metadata = await getTmdbPoster(cleanTitle, year);
            
            if (metadata.posterUrl) {
                console.log(`✅ Found: ${metadata.posterUrl}`);
                await prisma.event.update({
                    where: { id: event.id },
                    data: { 
                        posterUrl: metadata.posterUrl,
                        description: metadata.description || undefined
                    }
                });
            } else {
                console.warn(`⚠️ No poster found for: ${cleanTitle}`);
            }
        } catch (err) {
            console.error(`❌ Error refreshing "${cleanTitle}":`, err.message);
        }
        
        // Minor delay to avoid hitting rate limits too hard
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log('✨ DEEP CLEAN COMPLETE.');
}

deepClean()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
