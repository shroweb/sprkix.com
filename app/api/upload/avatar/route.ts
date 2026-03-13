import { NextResponse } from "next/server";
import { getUserFromServerCookie } from "@lib/server-auth";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import path from "path";
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

    const uploadDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const safeName = path
      .basename(file.name)
      .replace(/[/\\?%*:|"<>\x00-\x1F]/g, "_")
      .replace(/\s+/g, "-");
    const uniqueName = `avatar-${uuidv4()}-${safeName}`;
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({ url: `/uploads/${uniqueName}` });
  } catch (err) {
    console.error("Avatar upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
