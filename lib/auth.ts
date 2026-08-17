// lib/auth.ts — Server-only helper. Do not import in client or `pages/` components!
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { SESSION_USER_SELECT, type SessionUser } from './session-user'
import { verifyToken } from './jwt'

export async function getUserFromServerCookie() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    const decoded = await verifyToken<{ userId?: string }>(token)
    if (!decoded?.userId) return null

    return await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: SESSION_USER_SELECT,
    }) as SessionUser | null
}
