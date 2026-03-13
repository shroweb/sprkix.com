import { prisma } from "@lib/prisma";
import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user || !user.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const files = formData.getAll("file") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const results = [];
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const safeName = basename(file.name)
        .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
        .replace(/\s+/g, "-");
      const uniqueName = `${uuidv4()}-${safeName}`;

      let url: string;

      // ── Vercel Blob (production) ────────────────────────────────────────────
      // Uses dynamic import so the app still compiles/runs without the package.
      // To enable: npm install @vercel/blob and add BLOB_READ_WRITE_TOKEN to env.
      let usedBlob = false;
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const blobModule: any = await import("@vercel/blob").catch(() => null);
          if (blobModule?.put) {
            const blob = await blobModule.put(uniqueName, buffer, {
              access: "public",
              contentType: file.type || "application/octet-stream",
            });
            url = blob.url;
            usedBlob = true;
          }
        } catch (blobErr) {
          console.error("Vercel Blob upload failed, trying filesystem:", blobErr);
        }
      }

      // ── Filesystem fallback (local dev / self-hosted) ───────────────────────
      if (!usedBlob) {
        const uploadDir = join(process.cwd(), "public", "uploads");
        await mkdir(uploadDir, { recursive: true });
        const path = join(uploadDir, uniqueName);
        await writeFile(path, buffer);
        url = `/uploads/${uniqueName}`;
      }

      // Record in DB
      const media = await prisma.mediaItem.create({
        data: {
          filename: file.name,
          url,
          mimeType: file.type || null,
          size: file.size || null,
          uploadedBy: user.id,
        },
      });
      results.push(media);
    }

    return NextResponse.json(results.length === 1 ? results[0] : results);
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Upload failed", details: error.message || String(error) },
      { status: 500 },
    );
  }
}
