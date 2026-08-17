import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { SESSION_USER_SELECT, type SessionUser } from './session-user'
import { verifyToken } from './jwt'

interface DecodedToken {
  userId?: string
  id?: string
}

export async function getUserFromServerCookie() {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value
    if (!token) return null

    const decoded = await verifyToken<DecodedToken>(token)
    const userId = decoded?.userId || decoded?.id
    if (!userId) return null

    // Explicit select so adding new columns to the schema never breaks auth
    // before the production DB migration has been applied.
    return await prisma.user.findUnique({
      where: { id: userId },
      select: SESSION_USER_SELECT,
    }) as SessionUser | null
}
