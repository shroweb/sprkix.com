// lib/auth.ts — Server-only helper. Do not import in client or `pages/` components!
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { SESSION_USER_SELECT, type SessionUser } from './session-user'

export async function getUserFromServerCookie() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    try {
        const { userId } = jwt.verify(token, process.env.JWT_SECRET!) as any
        return await prisma.user.findUnique({
          where: { id: userId },
          select: SESSION_USER_SELECT,
        }) as SessionUser | null
    } catch {
        return null
    }
}
