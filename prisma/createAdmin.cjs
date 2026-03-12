require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')

const prisma = new PrismaClient()

const EMAIL = 'admin@sprkix.com'
const PASSWORD = 'admin123'
const NAME = 'Admin'
const SLUG = 'admin'

async function main() {
    console.log('Creating admin account...')

    const hashed = await bcrypt.hash(PASSWORD, 10)

    const existing = await prisma.user.findUnique({ where: { email: EMAIL } })

    if (existing) {
        // Update existing user to be admin
        await prisma.user.update({
            where: { email: EMAIL },
            data: { isAdmin: true, password: hashed }
        })
        console.log(`✅ Updated existing user ${EMAIL} → isAdmin: true`)
    } else {
        await prisma.user.create({
            data: {
                name: NAME,
                email: EMAIL,
                password: hashed,
                slug: SLUG,
                isAdmin: true,
            }
        })
        console.log(`✅ Created admin user: ${EMAIL}`)
    }

    console.log(`\n  Email:    ${EMAIL}`)
    console.log(`  Password: ${PASSWORD}`)
    console.log('\nLog in at /login')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
