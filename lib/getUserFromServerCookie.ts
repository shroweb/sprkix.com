import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

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

        return await prisma.user.findUnique({ where: { id: userId } })
    } catch (err) {
        console.error('[getUserFromServerCookie] Error:', err)
        return null
    }
}