import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { writeFile, mkdir } from "fs/promises";
import { join, basename } from "path";
import { v4 as uuidv4 } from "uuid";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: Request) {
  const user = await getUserFromServerCookie();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file || !("arrayBuffer" in file) || file.size === 0) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "File type not allowed. Use JPG, PNG, WEBP or GIF." },
        { status: 400 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum 5 MB." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const safeName = basename(file.name)
      .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
      .replace(/\s+/g, "-");
    const uniqueName = `avatar-${uuidv4()}-${safeName}`;

    let url = "";
    let usedBlob = false;

    // Vercel Blob (Production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        const { put } = await import("@vercel/blob");
        const blob = await put(`avatars/${uniqueName}`, buffer, {
          access: "public",
          contentType: file.type || "application/octet-stream",
        });
        url = blob.url;
        usedBlob = true;
      } catch (blobErr) {
        console.error("Vercel Blob failed, falling back:", blobErr);
      }
    }

    // Filesystem Fallback (Local)
    if (!usedBlob) {
      const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
      await mkdir(uploadDir, { recursive: true });
      const filePath = join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);
      url = `/uploads/avatars/${uniqueName}`;
    }

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
