const { PrismaClient } = require('@prisma/client')
const { getTmdbPoster } = require('./lib/getTmdbPoster.js')
const dotenv = require('dotenv')
const path = require('path')

// Load .env.local for TMDB key
dotenv.config({ path: path.resolve(__dirname, '.env.local') })

const prisma = new PrismaClient()

async function verify() {
  const EVENT_TITLE = 'AEW Revolution 2025'
  const YEAR = 2025
  const EVENT_ID = 'cmmoxirj50000uh2jh0nf5xvh'

  console.log(`🔍 Testing TMDb fetch for: ${EVENT_TITLE}...`)
  const metadata = await getTmdbPoster(EVENT_TITLE, YEAR)
  
  console.log('Result:', JSON.stringify(metadata, null, 2))

  if (metadata.posterUrl) {
    console.log('✅ Success! Found poster. Updating DB...')
    await prisma.event.update({
      where: { id: EVENT_ID },
      data: { posterUrl: metadata.posterUrl }
    })
    console.log('🚀 Database updated.')
  } else {
    console.log('❌ Failed to find poster.')
  }
}

verify().catch(console.error).finally(() => prisma.$disconnect())
