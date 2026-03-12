require('dotenv').config()
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const wrestlers = [
    { name: 'John Cena', slug: 'john-cena', bio: 'Sixteen-time world champion and face of WWE for over a decade. Known for his "You Can\'t See Me" catchphrase and unique blend of rap and sports entertainment.' },
    { name: 'Roman Reigns', slug: 'roman-reigns', bio: 'The Tribal Chief and Head of the Table. Undisputed WWE Universal Champion and one of the most dominant forces in modern wrestling history.' },
    { name: 'CM Punk', slug: 'cm-punk', bio: 'The Voice of the Voiceless. Best in the World. Known for his straight-edge lifestyle and legendary pipe bomb promo that changed the wrestling landscape.' },
    { name: 'Seth Rollins', slug: 'seth-rollins', bio: 'The Visionary and Monday Night Messiah. A technically gifted performer known for his high-flying style and remarkable consistency across multiple world title reigns.' },
    { name: 'AJ Styles', slug: 'aj-styles', bio: 'The Phenomenal One. A global ambassador for professional wrestling whose career spans TNA, ROH, NJPW, and WWE, earning championship gold everywhere he has competed.' },
    { name: 'Randy Orton', slug: 'randy-orton', bio: 'The Viper. A fourteen-time world champion known for his distinctive RKO finish and effortless ability to generate intense crowd reactions as both hero and villain.' },
    { name: 'Becky Lynch', slug: 'becky-lynch', bio: 'The Man. Lynch\'s career-defining babyface turn in 2018 made her one of the most popular wrestlers in the world and the face of the women\'s revolution.' },
    { name: 'Charlotte Flair', slug: 'charlotte-flair', bio: 'The Queen. Daughter of Ric Flair and a fourteen-time women\'s world champion, widely regarded as the most decorated female competitor in WWE history.' },
    { name: 'Rhea Ripley', slug: 'rhea-ripley', bio: 'The Eradicator and leader of Judgment Day. The powerhouse Australian champion who became one of the most dominant forces in modern women\'s wrestling.' },
    { name: 'Bianca Belair', slug: 'bianca-belair', bio: 'The EST of WWE — Strongest, Fastest, Baddest. Known for her incredible athleticism, her signature hair whip, and multiple WrestleMania main event moments.' },
    { name: 'Kenny Omega', slug: 'kenny-omega', bio: 'The Best Bout Machine. Executive Vice President of AEW and one of the most acclaimed in-ring performers of his generation, with legendary matches across NJPW and AEW.' },
    { name: 'MJF', slug: 'mjf', bio: 'Maxwell Jacob Friedman — The Salt of the Earth and AEW World Champion. Widely considered the best pure villain in contemporary professional wrestling.' },
    { name: 'Bryan Danielson', slug: 'bryan-danielson', bio: 'The American Dragon. A former WWE Champion known as Daniel Bryan, Danielson is consistently ranked among the greatest technical wrestlers of all time.' },
    { name: 'Chris Jericho', slug: 'chris-jericho', bio: 'Le Champion and The Wizard. A seven-time world champion across WWE, WCW, and AEW who reinvented himself multiple times across three decades at the top of the industry.' },
    { name: 'Cody Rhodes', slug: 'cody-rhodes', bio: 'The American Nightmare. The son of Dusty Rhodes who completed his story by winning the Undisputed WWE Championship at WrestleMania XL.' },
    { name: 'Jon Moxley', slug: 'jon-moxley', bio: 'Formerly Dean Ambrose in WWE and now a cornerstone of AEW. A three-time AEW World Champion known for his intense brawling style and unrelenting aggression.' },
    { name: 'Kevin Owens', slug: 'kevin-owens', bio: 'The Prize Fighter. A former Universal Champion and fan favourite known for his surprising blend of brutal power moves and quick, witty character work.' },
    { name: 'Sami Zayn', slug: 'sami-zayn', bio: 'The Honorary Uce turned fan favourite. His 2023 WrestleMania storyline with The Bloodline is widely considered one of the greatest long-form narratives in WWE history.' },
    { name: 'Hangman Adam Page', slug: 'hangman-adam-page', bio: 'The Anxious Millennial Cowboy. AEW\'s homegrown world champion whose long journey to the top became one of the most emotionally resonant title runs in modern wrestling.' },
    { name: 'Samoa Joe', slug: 'samoa-joe', bio: 'The Destroyer. A former NXT, TNA, ROH, and WWE United States Champion renowned for his suffocating submission game and legitimate aura of danger.' },
]

async function main() {
    console.log(`Seeding ${wrestlers.length} wrestlers...`)

    let added = 0
    let skipped = 0

    for (const w of wrestlers) {
        const existing = await prisma.wrestler.findUnique({ where: { slug: w.slug } })
        if (existing) {
            console.log(`  ↩  Skipped (exists): ${w.name}`)
            skipped++
            continue
        }
        await prisma.wrestler.create({ data: w })
        console.log(`  ✅ Added: ${w.name}`)
        added++
    }

    console.log(`\nDone. Added: ${added}, Skipped: ${skipped}`)
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
