import { prisma } from '../lib/prisma'
import slugify from 'slugify'

async function main() {
    const users = await prisma.user.findMany()

    for (const user of users) {
        if (!user.slug || user.slug === '') {
            const slug = slugify(user.name || user.email.split('@')[0], { lower: true })
            await prisma.user.update({
                where: { id: user.id },
                data: { slug },
            })
            console.log(`✅ Updated: ${user.email} -> ${slug}`)
        }
    }

    await prisma.$disconnect()
}

main()