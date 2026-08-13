import { r2Put, r2Delete, mediaKeyFromUrl } from "@lib/r2";
import { v4 as uuidv4 } from "uuid";

function safeFilename(name: string) {
  return basenameSafe(name)
    .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
    .replace(/\s+/g, "-");
}

function basenameSafe(name: string) {
  const idx = Math.max(name.lastIndexOf("/"), name.lastIndexOf("\\"));
  return idx >= 0 ? name.slice(idx + 1) : name;
}

function extensionFromMimeType(mimeType: string) {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/webp":
      return "webp";
    case "image/svg+xml":
      return "svg";
    case "image/x-icon":
    case "image/vnd.microsoft.icon":
      return "ico";
    case "image/gif":
      return "gif";
    case "image/avif":
      return "avif";
    default:
      return "bin";
  }
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(;base64)?,([\s\S]*)$/);
  if (!match) return null;

  const mimeType = match[1] || "application/octet-stream";
  const isBase64 = !!match[2];
  const payload = match[3] || "";

  try {
    const buffer = isBase64
      ? Buffer.from(payload, "base64")
      : Buffer.from(decodeURIComponent(payload), "utf8");
    return { mimeType, buffer };
  } catch {
    return null;
  }
}

export async function uploadPublicFile({
  file,
  folder,
  prefix,
}: {
  file: File;
  folder: string; // e.g. "avatars" | "wrestlers" | "admin"
  prefix?: string;
}): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const safeName = safeFilename(file.name || "upload");
  const uniqueName = `${prefix ? `${prefix}-` : ""}${uuidv4()}-${safeName}`;
  const url = await r2Put(
    `${folder}/${uniqueName}`,
    buffer,
    file.type || "application/octet-stream",
  );
  return { url };
}

export async function uploadDataUrl({
  dataUrl,
  folder,
  prefix,
}: {
  dataUrl: string;
  folder: string;
  prefix?: string;
}): Promise<{ url: string }> {
  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw new Error("Invalid data URL");
  }

  const extension = extensionFromMimeType(parsed.mimeType);
  const uniqueName = `${prefix ? `${prefix}-` : ""}${uuidv4()}.${extension}`;
  const url = await r2Put(`${folder}/${uniqueName}`, parsed.buffer, parsed.mimeType);
  return { url };
}

export async function deletePublicFile(url: string): Promise<void> {
  if (!url) return;

  const key = mediaKeyFromUrl(url);
  if (key) {
    await r2Delete(key);
    return;
  }

  // Legacy: local filesystem URLs from before the /media route existed.
  if (!url.startsWith("/uploads/")) return;
  try {
    const { unlink } = await import("fs/promises");
    const { resolve, normalize } = await import("path");
    const publicDir = resolve(process.cwd(), "public");
    const target = resolve(publicDir, normalize(url).replace(/^\/+/, ""));
    if (target.startsWith(publicDir + "/")) {
      await unlink(target);
    }
  } catch {
    /* file may already be gone */
  }
}
