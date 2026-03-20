import { MetadataRoute } from 'next'
import { prisma } from '@lib/prisma'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://poisonrana.com'

  // Static routes
  const staticRoutes = [
    '',
    '/events',
    '/wrestlers',
    '/promotions',
    '/rankings',
    '/leaderboard',
    '/matches',
    '/lists',
    '/polls',
    '/faq',
    '/contact',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Dynamic routes
  let events: any[] = []
  let wrestlers: any[] = []
  let users: any[] = []

  try {
    const [fetchedEvents, fetchedWrestlers, fetchedUsers] = await Promise.all([
      prisma.event.findMany({ select: { slug: true, createdAt: true } }),
      prisma.wrestler.findMany({ select: { slug: true, createdAt: true } }),
      prisma.user.findMany({ select: { slug: true, createdAt: true } }),
    ])
    events = fetchedEvents
    wrestlers = fetchedWrestlers
    users = fetchedUsers
  } catch (error) {
    console.error('Sitemap dynamic fetch error:', error)
  }

  const eventRoutes = events.map((event) => ({
    url: `${baseUrl}/events/${event.slug}`,
    lastModified: event.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const wrestlerRoutes = wrestlers.map((wrestler) => ({
    url: `${baseUrl}/wrestlers/${wrestler.slug}`,
    lastModified: wrestler.createdAt,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  const userRoutes = users.map((user) => ({
    url: `${baseUrl}/users/${user.slug}`,
    lastModified: user.createdAt,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [...staticRoutes, ...eventRoutes, ...wrestlerRoutes, ...userRoutes]
}
