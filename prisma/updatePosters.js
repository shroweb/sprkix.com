const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const csv = require('csv-parser')
const { getTmdbPoster } = require('../lib/getTmdbPoster')

const prisma = new PrismaClient()

function loadCsv(file) {
    return new Promise((resolve) => {
        const results = []
        fs.createReadStream(file)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve(results))
    })
}

async function main() {
    console.log('🚀 Starting updatePosters.js...')
    const enriched = await loadCsv('enriched_events.csv')
    console.log(`📄 Loaded ${enriched.length} events from CSV`)

    for (const e of enriched) {
        try {
            const existing = await prisma.event.findUnique({ where: { slug: e.slug } })
            if (!existing) {
                console.warn(`⚠️ Skipped ${e.title}: No record found for slug "${e.slug}"`)
                continue
            }

            const { posterUrl, description, tmdbId } = await getTmdbPoster(e.title, e.date.split('-')[0])

            const updated = await prisma.event.update({
                where: { slug: e.slug },
                data: {
                    posterUrl,
                    description,
                    tmdbId: tmdbId || undefined,
                },
            })

            console.log(`✅ Updated: ${updated.title}`)
        } catch (err) {
            console.warn(`⚠️ Skipped ${e.title}: ${err.message}`)
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())