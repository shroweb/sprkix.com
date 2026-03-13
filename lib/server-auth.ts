import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export async function getUserFromServerCookie() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) {
        console.warn('[Auth] No token found in cookies. All cookies:', cookieStore.getAll())
        return null
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!)
        const userId = (decoded as any).userId

        if (!userId || typeof userId !== 'string') {
            console.error('[Auth] Invalid or missing userId in JWT payload:', decoded)
            return null
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              email: true,
              name: true,
              slug: true,
              avatarUrl: true,
              isVerified: true,
              isAdmin: true,
              favoritePromotion: true,
              createdAt: true,
              password: true,
              predictionScore: true,
              predictionCount: true,
              // Still excluding profileThemeEventId until DB is migrated
            }
        })

        if (!user) {
            console.warn('[Auth] No user found with ID:', userId)
            return null
        }

        return user as any
    } catch (err: any) {
        console.error('[Auth] Failed to verify JWT:', err.message, err.stack);
        return null;
    }
}