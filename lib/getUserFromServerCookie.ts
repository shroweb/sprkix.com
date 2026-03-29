import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { SESSION_USER_SELECT, type SessionUser } from './session-user'

interface DecodedToken {
  userId?: string
  id?: string
}

export async function getUserFromServerCookie() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    try {
        if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not defined')

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as DecodedToken
        const userId = decoded.userId || decoded.id
        if (!userId) throw new Error('userId not found in token payload')

        // Explicit select so adding new columns to the schema never breaks auth
        // before the production DB migration has been applied.
        return await prisma.user.findUnique({
          where: { id: userId },
          select: SESSION_USER_SELECT,
        }) as SessionUser | null
    } catch (err) {
        console.error('[getUserFromServerCookie] Error:', err)
        return null
    }
}
