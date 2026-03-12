import { prisma } from '../lib/prisma'

async function cleanTitles() {
    const events = await prisma.event.findMany()

    for (const event of events) {
        const year = new Date(event.date).getFullYear()
        const titleWithoutDate = event.title.replace(/–.*$/, `– ${year}`)

        await prisma.event.update({
            where: { id: event.id },
            data: { title: titleWithoutDate },
        })
    }

    console.log('✅ Titles updated to include only the year.')
}

cleanTitles()