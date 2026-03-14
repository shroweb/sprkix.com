import { put, del } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import { join, basename, resolve, normalize } from "path";
import { v4 as uuidv4 } from "uuid";

function safeFilename(name: string) {
  return basename(name)
    .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
    .replace(/\s+/g, "-");
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
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const safeName = safeFilename(file.name || "upload");
  const uniqueName = `${prefix ? `${prefix}-` : ""}${uuidv4()}-${safeName}`;

  const vercel = !!process.env.VERCEL;
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  if (hasBlob) {
    const blob = await put(`${folder}/${uniqueName}`, buffer, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });
    return { url: blob.url };
  }

  if (vercel) {
    // Filesystem writes won't persist on Vercel; fail fast with a clear error.
    throw new Error(
      "Missing BLOB_READ_WRITE_TOKEN. Configure Vercel Blob to enable uploads in production.",
    );
  }

  const uploadDir = join(process.cwd(), "public", "uploads", folder);
  await mkdir(uploadDir, { recursive: true });
  const filePath = join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);
  return { url: `/uploads/${folder}/${uniqueName}` };
}

export async function deletePublicFile(url: string): Promise<void> {
  if (!url) return;

  const vercel = !!process.env.VERCEL;
  const hasBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

  // If it's a remote URL, treat it as a Blob URL (we only ever write Blob URLs in prod).
  if (/^https?:\/\//i.test(url)) {
    if (!hasBlob) {
      if (vercel) {
        throw new Error(
          "Missing BLOB_READ_WRITE_TOKEN. Configure Vercel Blob to enable media deletion in production.",
        );
      }
      // In local dev, we can't delete remote URLs without a token; just no-op.
      return;
    }
    await del(url);
    return;
  }

  // Local filesystem fallback: only allow deleting inside /public/uploads
  if (!url.startsWith("/uploads/")) return;

  const publicDir = resolve(process.cwd(), "public");
  const target = resolve(publicDir, normalize(url).replace(/^\/+/, ""));
  if (!target.startsWith(publicDir + "/")) return;

  try {
    const { unlink } = await import("fs/promises");
    await unlink(target);
  } catch {
    /* file may already be gone */
  }
}
