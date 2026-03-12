import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const events = [
    {
        title: 'WrestleMania XL',
        slug: 'wrestlemania-xl-2024',
        date: new Date('2024-04-06'),
        promotion: 'WWE',
        description: 'WrestleMania XL took place over two nights at Lincoln Financial Field in Philadelphia. Night 1 headlined with Rhea Ripley defending the Women\'s World Championship, and Night 2 featured Cody Rhodes finally finishing his story by defeating Roman Reigns for the Undisputed WWE Championship.',
        type: 'ppv',
    },
    {
        title: 'AEW All In – 2023',
        slug: 'aew-all-in-2023',
        date: new Date('2023-08-27'),
        promotion: 'AEW',
        description: 'AEW All In 2023 set a new attendance record for a professional wrestling event in the UK, held at Wembley Stadium in London with over 81,000 fans in attendance. MJF defended the AEW World Championship against Adam Cole in the main event.',
        type: 'ppv',
    },
    {
        title: 'WWE Elimination Chamber – Perth 2024',
        slug: 'wwe-elimination-chamber-perth-2024',
        date: new Date('2024-02-24'),
        promotion: 'WWE',
        description: 'Held at Optus Stadium in Perth, Australia, this was WWE\'s first major premium live event in Australia. Cody Rhodes won the Elimination Chamber match to secure his WrestleMania main event spot.',
        type: 'ppv',
    },
    {
        title: 'AEW Dynasty 2024',
        slug: 'aew-dynasty-2024',
        date: new Date('2024-04-21'),
        promotion: 'AEW',
        description: 'AEW\'s inaugural Dynasty pay-per-view event, held at the Chaifetz Arena in St. Louis. Swerve Strickland defeated Samoa Joe to win his first AEW World Championship in the main event.',
        type: 'ppv',
    },
    {
        title: 'WWE SummerSlam 2024',
        slug: 'wwe-summerslam-2024',
        date: new Date('2024-08-03'),
        promotion: 'WWE',
        description: 'SummerSlam 2024 was held at Cleveland Browns Stadium, marking the first time SummerSlam was held in an outdoor NFL stadium. Cody Rhodes retained the Undisputed WWE Championship against Solo Sikoa in the main event.',
        type: 'ppv',
    },
    {
        title: 'AEW All Out 2023',
        slug: 'aew-all-out-2023',
        date: new Date('2023-09-03'),
        promotion: 'AEW',
        description: 'AEW All Out 2023 featured MJF defending the AEW World Championship against Samoa Joe, and CM Punk returning to challenge MJF in a memorable surprise moment. The show also featured the debut of Samoa Joe\'s tenure as a top contender.',
        type: 'ppv',
    },
    {
        title: 'WWE Royal Rumble 2024',
        slug: 'wwe-royal-rumble-2024',
        date: new Date('2024-01-27'),
        promotion: 'WWE',
        description: 'The Royal Rumble 2024 was held at Tropicana Field in St. Petersburg, Florida. Cody Rhodes won the men\'s Royal Rumble match for the second year in a row, earning his second consecutive WrestleMania main event opportunity.',
        type: 'ppv',
    },
    {
        title: 'AEW Double or Nothing 2024',
        slug: 'aew-double-or-nothing-2024',
        date: new Date('2024-05-26'),
        promotion: 'AEW',
        description: 'AEW Double or Nothing 2024 was held at the MGM Grand Garden Arena in Las Vegas. Swerve Strickland defended his AEW World Championship against Samoa Joe in the main event.',
        type: 'ppv',
    },
    {
        title: 'WWE Crown Jewel 2023',
        slug: 'wwe-crown-jewel-2023',
        date: new Date('2023-11-04'),
        promotion: 'WWE',
        description: 'WWE Crown Jewel 2023 took place at Mohammed Abdu Arena in Riyadh, Saudi Arabia. LA Knight challenged Roman Reigns for the Undisputed WWE Universal Championship in the main event.',
        type: 'ppv',
    },
    {
        title: 'AEW Revolution 2024',
        slug: 'aew-revolution-2024',
        date: new Date('2024-03-03'),
        promotion: 'AEW',
        description: 'AEW Revolution 2024 was held at the Greensboro Coliseum in Greensboro, North Carolina. Samoa Joe defended the AEW World Championship against Swerve Strickland in a hard-hitting main event, while Sting competed in his retirement match.',
        type: 'ppv',
    },
]

async function main() {
    console.log('Seeding events...')

    for (const event of events) {
        const existing = await prisma.event.findUnique({ where: { slug: event.slug } })
        if (existing) {
            console.log(`  Skipped (exists): ${event.title}`)
            continue
        }
        await prisma.event.create({ data: event })
        console.log(`  Created: ${event.title}`)
    }

    console.log('Done.')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
