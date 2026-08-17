// lib/jwt.ts — Server-only JWT helpers built on `jose` (edge-compatible).
// Replaces the old `jsonwebtoken` usage; tokens remain HS256-signed with the
// same JWT_SECRET, so existing sessions keep working after deploy.
import { SignJWT, jwtVerify } from "jose";

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined");
  return new TextEncoder().encode(secret);
}

/** Sign a token with the given payload and expiry (e.g. "7d", "1h", or seconds). */
export async function signToken(
  payload: Record<string, unknown>,
  expiresIn: string | number,
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(getJwtSecret());
}

/** Verify a token and return its payload, or null if invalid/expired. */
export async function verifyToken<T = Record<string, unknown>>(
  token: string,
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    });
    return payload as T;
  } catch {
    return null;
  }
}
