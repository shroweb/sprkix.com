import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

const USER_SELECT = {
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
  profileThemeEventId: true,
  needsUsernameSetup: true,
};

async function getUserByToken(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    const userId = (decoded as any).userId;

    if (!userId || typeof userId !== 'string') {
      console.error('[Auth] Invalid or missing userId in JWT payload:', decoded);
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    });

    if (!user) {
      console.warn('[Auth] No user found with ID:', userId);
      return null;
    }

    return user as any;
  } catch (err: any) {
    console.error('[Auth] Failed to verify JWT:', err.message);
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
  if (!token) {
    console.warn('[Auth] No token found in cookies. All cookies:', cookieStore.getAll());
    return null;
  }
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
