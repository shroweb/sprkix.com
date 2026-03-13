const dotenv = require('dotenv')
const path = require('path')
// Explicitly load .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcrypt')
const prisma = new PrismaClient()

async function resetAdmin() {
  const EMAIL = 'recovery@sprkix.com'
  const PASSWORD = 'password123'
  const hashed = await bcrypt.hash(PASSWORD, 10)

  console.log('Using DATABASE_URL:', process.env.DATABASE_URL?.split('@')[1] || 'NOT FOUND')
  
  console.log('Creating/Updating recovery admin on LIVE DB...')
  const user = await prisma.user.upsert({
    where: { email: EMAIL },
    update: { 
      password: hashed, 
      isAdmin: true,
      name: 'Recovery Admin'
    },
    create: {
      email: EMAIL,
      password: hashed,
      name: 'Recovery Admin',
      slug: 'recovery-admin-' + Date.now(),
      isAdmin: true
    }
  })
  console.log('✅ Success! User:', user.email)
}

resetAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
