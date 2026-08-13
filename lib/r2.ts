import { getCloudflareContext } from "@opennextjs/cloudflare";
import { mkdir, readFile, writeFile, unlink } from "fs/promises";
import { dirname, join } from "path";

/**
 * Media storage abstraction.
 *
 * On Cloudflare Workers, files are stored in the MEDIA_BUCKET R2 bucket and
 * served back through the `/media/[...key]` route handler.
 *
 * Under plain `next dev` (no wrangler), files fall back to the local
 * filesystem under `public/uploads/` and are still served through the same
 * `/media/[...key]` route, so URLs stay identical in both environments.
 */

const LOCAL_DIR = join(process.cwd(), "public", "uploads");

// Minimal structural types for the R2 bindings we use (avoids pulling in the
// full @cloudflare/workers-types globals, which conflict with the DOM lib).
interface MediaBucket {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string | Blob,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<void>;
  get(key: string): Promise<MediaObject | null>;
  delete(key: string): Promise<void>;
}

interface MediaObject {
  body: ReadableStream | null;
  httpEtag: string;
  writeHttpMetadata(headers: Headers): void;
}

type MediaBody = ArrayBuffer | ArrayBufferView | string | Blob;

function getBucket(): MediaBucket | undefined {
  try {
    const env = getCloudflareContext().env as unknown as {
      MEDIA_BUCKET?: MediaBucket;
    };
    return env.MEDIA_BUCKET;
  } catch {
    return undefined;
  }
}

async function toBuffer(body: MediaBody): Promise<Buffer> {
  if (body instanceof Blob) return Buffer.from(await body.arrayBuffer());
  return Buffer.from(body as any);
}

/**
 * Store a file and return the public path that serves it (via /media/[...key]).
 */
export async function r2Put(
  key: string,
  body: MediaBody,
  contentType: string,
): Promise<string> {
  const bucket = getBucket();
  if (bucket) {
    await bucket.put(key, body, { httpMetadata: { contentType } });
  } else {
    const filePath = join(LOCAL_DIR, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, await toBuffer(body));
  }
  return `/media/${key}`;
}

/**
 * Delete a stored file (no-op if it doesn't exist).
 */
export async function r2Delete(key: string): Promise<void> {
  const bucket = getBucket();
  if (bucket) {
    await bucket.delete(key);
    return;
  }
  try {
    await unlink(join(LOCAL_DIR, key));
  } catch {
    /* file may already be gone */
  }
}

/**
 * Read a stored file back. Returns the R2 object when running on Workers,
 * or a Buffer under plain node dev. Returns null when the key is missing.
 */
export async function r2Read(key: string): Promise<MediaObject | Buffer | null> {
  const bucket = getBucket();
  if (bucket) {
    return (await bucket.get(key)) ?? null;
  }
  try {
    return await readFile(join(LOCAL_DIR, key));
  } catch {
    return null;
  }
}

/**
 * Convert a public /media/<key> (or absolute) URL back into an R2 key.
 * Returns null for anything that isn't one of our media URLs.
 */
export function mediaKeyFromUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("/media/")) return url.slice("/media/".length);
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/media/")) {
      return parsed.pathname.slice("/media/".length);
    }
  } catch {
    /* not a URL */
  }
  return null;
}
