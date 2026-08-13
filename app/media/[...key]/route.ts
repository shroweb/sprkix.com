import { NextRequest, NextResponse } from "next/server";
import { r2Read } from "@lib/r2";
import { extname } from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

/**
 * Serves uploaded media from R2 (or the local dev filesystem) by key.
 * e.g. GET /media/avatars/<id>.jpg
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ key: string[] }> },
) {
  const { key } = await ctx.params;
  const objectKey = key.join("/");

  const data = await r2Read(objectKey);
  if (!data) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers = new Headers();
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  if (data instanceof Buffer || data instanceof Uint8Array) {
    const contentType =
      MIME_BY_EXT[extname(objectKey).toLowerCase()] || "application/octet-stream";
    headers.set("Content-Type", contentType);
    return new NextResponse(data as any, { headers });
  }

  // R2 object body
  data.writeHttpMetadata(headers);
  headers.set("etag", data.httpEtag);
  return new NextResponse(data.body, { headers });
}
