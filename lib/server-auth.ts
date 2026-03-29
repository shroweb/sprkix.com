import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'
import { SESSION_USER_SELECT, type SessionUser } from './session-user'

async function getUserByToken(token: string): Promise<SessionUser | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;

    if (!userId || typeof userId !== 'string') {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: SESSION_USER_SELECT,
    });

    return user as SessionUser | null;
  } catch {
    return null;
  }
}

/**
 * For Next.js page/layout server components — reads from the request cookie store.
 * Not usable from mobile; use getUserFromRequest() in API route handlers instead.
 */
export async function getUserFromServerCookie() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return getUserByToken(token);
}

/**
 * For API route handlers — supports both:
 *   - Authorization: Bearer <token>  (React Native / mobile app)
 *   - Cookie: token=<value>           (web browser)
 *
 * Note: the CORS middleware already injects the Bearer token as a cookie, so in
 * practice getUserFromServerCookie() will also work for mobile requests that pass
 * through the middleware. This function is the explicit version for clarity.
 */
export async function getUserFromRequest(req: Request) {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return getUserByToken(token);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;
  if (!token) return null;
  return getUserByToken(token);
}
