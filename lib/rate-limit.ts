// lib/rate-limit.ts — DB-backed sliding-window rate limiting.
// Works across Cloudflare Workers isolates (unlike in-memory counters).
import { prisma } from "@lib/prisma";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Check + increment a rate limit bucket.
 *
 * @param key   Unique bucket key, e.g. `login:user@example.com` or `chat:eventId:userId`
 * @param limit Max hits allowed per window
 * @param windowSeconds  Window length
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  try {
    const entry = await prisma.rateLimitEntry.upsert({
      where: { key },
      create: { key, hits: 1, windowStart: now },
      update: { hits: { increment: 1 } },
    });

    let hits = entry.hits;
    let start = entry.windowStart;

    // Window rolled over — restart the count
    if (start < windowStart) {
      const reset = await prisma.rateLimitEntry.update({
        where: { key },
        data: { hits: 1, windowStart: now },
      });
      hits = reset.hits;
      start = reset.windowStart;
    }

    if (hits <= limit) {
      return { allowed: true, remaining: limit - hits, retryAfterSeconds: 0 };
    }

    const elapsed = Math.max(0, now.getTime() - start.getTime());
    const retryAfterSeconds = Math.ceil((windowSeconds * 1000 - elapsed) / 1000);
    return { allowed: false, remaining: 0, retryAfterSeconds };
  } catch (err) {
    // Fail open — never block traffic because the limiter itself errored.
    console.error("[rate-limit] limiter error:", err);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** Convenience: 429 JSON response with Retry-After header. */
export function rateLimitedResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests — please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}